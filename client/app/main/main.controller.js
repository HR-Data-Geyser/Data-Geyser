'use strict';

angular.module('dataGeyserApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeTweets = [];

    $http.get('/api/tweets').success(function(awesomeTweets) {
      $scope.awesomeTweets = awesomeTweets;
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
      console.log(topic);
      $http.post('/api/tweets/getTweets/' + topic).success(function(){
        console.log('success');
      })
    }
  });
