'use strict';

angular.module('dataGeyserApp')

  .controller('MainCtrl', function ($scope, $http, socket, Interceptor) {
    $scope.awesomeTweets = [];
    $scope.tweetParser = [];
    $scope.topic = "ebola";
    
    window.onkeydown = checkKeyPressed;
    
    var tweetTempStorage = {};
    
    ///////// keydown event listener function //////////////
    
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
      for (var i = 0; i < awesomeTweets.length; i++){
        tweetTempStorage[awesomeTweets[i].keyword] = tweetTempStorage[awesomeTweets[i].keyword] || 0;
        tweetTempStorage[awesomeTweets[i].keyword]++;
      }
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

    $scope.addTweet = function() {
      if($scope.newTweet === '') {
        return;
      }
      $http.post('/api/tweets', { name: $scope.newTweet });
      $scope.newTweet = '';
    };

    $scope.deleteTweet = function(tweet) {
      $http.delete('/api/tweets/' + tweet._id);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('tweet');
    });
    
    $scope.chooseTopic = function(topic){
      $http.post('/api/tweets/getTweets/' + topic).success(function(){
        console.log('post success');
      });
    }
    
    $scope.getTopic = function(topic, callback) {
      Interceptor.start(); 
      $http.get('/api/tweets/getTweets/' + topic)
      .success(function(data){

        Interceptor.end();
        renderTweets(data);
      });
    }
    
    $scope.destroyTopic = function(topic) {
      $http.delete('/api/tweets/getTweets/' + topic).success(function(){
        console.log(topic, 'destroyed');
      })
    }
    
  });
