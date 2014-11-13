'use strict';

angular.module('dataGeyserApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeTweets = [];
    $scope.counter = 0;
    $scope.kardashian = 0;
    $scope.topic;
    
    $http.get('/api/tweets').success(function(awesomeTweets) {
      $scope.awesomeTweets = awesomeTweets;
      for (var i = 0; i < awesomeTweets.length; i++){
        if (awesomeTweets[i].keyword === 'ebola') {
          $scope.counter++;
        } else if (awesomeTweets[i].keyword === 'kardashian') {
          $scope.kardashian++;
        }
      }
      socket.syncUpdates('tweet', $scope.awesomeTweets);
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
      $http.post('/api/tweets/getTweets/' + topic).success(function(data){
        console.log('post success');
        console.log(data);
      });
    }
    
    $scope.getTopic = function(topic, callback) {
      $http.get('/api/tweets/getTweets/' + topic).success(function(data){
        console.log('get success');
        $scope.awesomeTweets = data;
        // callback(data);
      });
    }
    
  });
