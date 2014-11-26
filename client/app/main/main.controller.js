'use strict';

angular.module('dataGeyserApp')

  .controller('MainCtrl', ['$scope', '$http', 'socket', 'Interceptor', function ($scope, $http, socket, Interceptor) {
    $scope.awesomeTweets = [];
    $scope.tweetParser = [];
    $scope.streaming = false;

    window.onkeydown = checkKeyPressed;

    $scope.tweetTempStorage = {};

    ///////// keydown event listener function...should probably go elsewhere //////////////
    
    function checkKeyPressed(e){
      if (e.keyCode === 32) {
        e.preventDefault();
        vrControls.zeroSensor();
      }

      if (e.keyCode === 13) {
        e.preventDefault();
        $scope.getTopic($scope.topic);
      }

      if (e.keyCode === 81){
        e.preventDefault();
        $('#gui').toggle(1000);
      }
    }

    ////////// scope methods ///////////

    $http.get('/api/tweets').success(function(awesomeTweets) {
      $scope.awesomeTweets = awesomeTweets;

      // creates object param for each topic in DB with total num of tweets
      for (var i = 0; i < awesomeTweets.length; i++){
        $scope.tweetTempStorage[awesomeTweets[i].keyword] = $scope.tweetTempStorage[awesomeTweets[i].keyword] || 0;
        $scope.tweetTempStorage[awesomeTweets[i].keyword]++;
      }

      // changes db summary object into array
      for (var key in $scope.tweetTempStorage) {
        $scope.newBucket = {};
        $scope.newBucket.topic = key;
        $scope.newBucket.numTweets = $scope.tweetTempStorage[key];

        if ($scope.tweetTempStorage[key] > 2000) {
          $scope.newBucket.isOptimal = "Yes";
        } else {
          $scope.newBucket.isOptimal = "No";
        }

        $scope.tweetParser.push($scope.newBucket);
      }
      // socket.syncUpdates('tweet', $scope.awesomeTweets);
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('tweet');
    });

    // starts twitter api stream
    $scope.chooseTopic = function(){
      $scope.streaming = true;
      $http.post('/api/tweets/getTweets/ebola').success(function(){
        console.log('post success');
      });
    }

    // stops twitter stream
    $scope.stopTopic = function(){
      $scope.streaming = false;
      $http.put('/api/tweets/getTweets/ebola').success(function(){
        console.log('stopped stream');
      });
    }

    // fetches tweets matching topic from DB
    $scope.getTopic = function() {

      // Interceptor.start(); 
      // $('#gui').hide();

      $http.get('/api/tweets/getTweets/ebola').success(function(data){

        // Interceptor.end();
        renderTweets(data);
      });
    }


    // destroys all tweets matching topic in DB
    $scope.destroyTopic = function() {
      Interceptor.start();
      $http.delete('/api/tweets/getTweets/ebola').success(function(){
        Interceptor.end();
        console.log(topic, 'destroyed');
      })
    }

  }]);
