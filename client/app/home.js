
angular.module('costars.home' , [])

//THE CONTROLLER FOR THE ENTIRE COSTARS WEBSITE

.controller('HomeController', function($scope, $location, $http, ApiCalls, DB) {
  $scope.movies = []; //the movies we're currently displaying
  $scope.currentSearches = []; //array of actor names
  $scope.actorIds = []; //it will be a list of ids
  //getMovies is called every time an actor is removed or added to the list
  $scope.getMovies = function (){
    if(!$scope.currentSearches.length){
      $scope.movies = []; //Empty the movie list
      $scope.actorIds = []; //Shouldn't be necessary, just a precaution
      return; 
    }
    if($scope.currentSearches.length === 1){
      //api call for one persons stuff
      console.log("In getMovies, length is one, about to make DB call")
      return DB.getActor($scope.currentSearches[0])
      .then(function(data){
        console.log('1 actor only data', data);
        $scope.movies = data.known_for; //set it to the well known movies
      })
      .catch(function(){
        //wasn't in the data base so do an api call, this probably means there's a DB error
        console.log("In getMovies, length is one, DB call failed, make API call");
        ApiCalls.searchByPerson($scope.currentSearches[0]) // maybe .then( display stuff)\
          .then(function(data){
            //show at the data once obtained!!
            //stores all the information given in the database
          $scope.storeActorDb(data.results[0]);
          $scope.movies = data.results[0].known_for;
          })
          .catch(function(err){
            console.log("Error making SBP call: ", err);
          }) 
      })
    }
    else{
      return ApiCalls.discover($scope.actorIds)
        .then(function(movies) {
          console.log("Movies from discover call: ", movies);
          $scope.movies = movies;
        })
        .catch(function(error) {
          console.log("couldn't search multiple actors: ", error);
        });
    }
  };
  //calls on storeActor from factories and makes it a promise
  $scope.storeActorDb = function(data){
    return DB.storeActor(data)
      .then(function(resp){
        console.log("actor stored",resp);
      })
      .catch(function(error){
        console.log("actor not stored:",error);
      });
  };

  // adding selected actor to the view and the currentSearches Array
  //actorInput is the input that the user gave us 
  $scope.addActorInput = function (actorInput){
    actorInput = actorInput.trim();
    actorInput = actorInput.replace(/\s+/g, ' '); //trim down whitespace to single spaces, in case of typos
    actorInput = actorInput.split(' ').map(function(actorName){
      actorName = actorName.toLowerCase();
      return actorName.charAt(0).toUpperCase() + actorName.slice(1); //Capitalize first letter
    }).join(' '); //format all names the same
    if($scope.currentSearches.includes(actorInput)){
      console.log("Already stored ", actorInput);
      return;
    }
    $scope.currentSearches.push(actorInput);

    DB.getActor(actorInput)
    .then(function(actorData){
      $scope.actorIds.push(actorData.id); //add the id to our list
    })
    .catch(function(err){ //not found in DB
      console.log("Didn't find " + actorInput + " in database, making API call");
      ApiCalls.searchByPerson(actorInput)
      .then(function(actorData){
        if(!actorData.results.length){ //not found
          alert(actorInput + " not found!") //TODO: make a better way to display this error
          $scope.currentSearches.pop(); //remove from searches
          //no need to getMovies here, list shouldn't have changed
        }else{
          $scope.actorIds.push(actorData.results[0].id); //add the id to our list
          $scope.storeActorDb(actorData.results[0]) //store the data
          .then(function(resp){
            $scope.getMovies(); //get the movies for the current actor list
          })
          .catch(function(err){
            console.log("Error storing to database (in addActorInput): ", err);
            $scope.getMovies() //still want to retrieve movies
          })
        }
      })
      .catch(function(err){
        console.log("Error getting actor from tmDB: ", err);
        $scope.currentSearches.pop();
      })
    }) 
  }

  //removing the actor from the view and currentSearches Array
  //actor is the specific actor clicked on the page
  $scope.removesActorInput = function(actor){
    var index = $scope.currentSearches.indexOf(actor);
    if(index>=0){
      $scope.currentSearches.splice(index, 1);
      $scope.actorIds.splice(index, 1);
      $scope.getMovies();
    }else{
      console.log("removing actor input failed");
    }
  }
}) //END OF CONTROLLER

