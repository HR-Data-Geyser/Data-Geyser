'use strict';

angular.module('dataGeyserApp')

  .controller('MainCtrl', function ($scope, $http, socket, Interceptor) {
    $scope.awesomeTweets = [];
    $scope.tweetParser = [];
    $scope.topic = "ebola";
    $scope.streaming = false;
    
    window.onkeydown = checkKeyPressed;
    
    var tweetTempStorage = {};
    
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
    }
    
    ////////// scope methods ///////////
    
    $http.get('/api/tweets').success(function(awesomeTweets) {
      $scope.awesomeTweets = awesomeTweets;
      
      // creates object param for each topic in DB with total num of tweets
      for (var i = 0; i < awesomeTweets.length; i++){
        tweetTempStorage[awesomeTweets[i].keyword] = tweetTempStorage[awesomeTweets[i].keyword] || 0;
        tweetTempStorage[awesomeTweets[i].keyword]++;
      }
      
      // changes db summary object into array 
      for (var key in tweetTempStorage) {
        var newBucket = {};
        newBucket.topic = key;
        newBucket.numTweets = tweetTempStorage[key];
        
        if (tweetTempStorage[key] > 2000) {
          newBucket.isOptimal = "Yes";
        } else {
          newBucket.isOptimal = "No";
        }
        
        $scope.tweetParser.push(newBucket);
      }
      // socket.syncUpdates('tweet', $scope.awesomeTweets);
    });

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('tweet');
    });
    
    // starts twitter api stream
    $scope.chooseTopic = function(topic){
      $scope.streaming = true;
      $http.post('/api/tweets/getTweets/' + topic).success(function(){
        console.log('post success');
      });
    }
    
    $scope.stopTopic = function(topic){
      $scope.streaming = false;
      $http.put('/api/tweets/getTweets/' + topic).success(function(){
        console.log('stopped stream');
      });
    }
    
    $scope.getTopic = function(topic) {
      Interceptor.start(); 
      $http.get('/api/tweets/getTweets/' + topic)
      .success(function(data){

        Interceptor.end();
        renderTweets(data);
      });
    }
    
    $scope.destroyTopic = function(topic) {
      Interceptor.start();
      $http.delete('/api/tweets/getTweets/' + topic).success(function(){
        Interceptor.end();
        console.log(topic, 'destroyed');
      })
    }
    
  });
