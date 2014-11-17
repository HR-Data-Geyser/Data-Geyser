'use strict';

angular.module('dataGeyserApp')

  .controller('MainCtrl', function ($scope, $http, socket, Interceptor) {
    $scope.awesomeTweets = [];
    $scope.tweetParser = [];
    $scope.topic = "ebola";
    window.onkeydown = checkKeyPressed;
    
    var tweetTempStorage = {};

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
      console.log('stream open'); 
      $http.post('/api/tweets/getTweets/' + topic).success(function(){
        console.log('post success');
      });
    }
    
    $scope.getTopic = function(topic, callback) {
      console.log('getLoading'); 
      Interceptor.start(); 

      $http.get('/api/tweets/getTweets/' + topic)
      .success(function(data){

        console.log('get success');
        Interceptor.end();
        renderTweets(data);
      });
    }
    
    $scope.destroyTopic = function(topic) {
      $http.delete('/api/tweets/getTweets/' + topic).success(function(){
        console.log('destroyed');
      })
    }
    
  });
  
//////// simple function to calculate random value between -20 and 20 for fountain offset ////////

var nodeTargetRandom = function(){
  return Math.random() * (20 - (-20)) + (-20);
}

////////////// renders tweets in order gathered from DB ////////////////

var renderTweets = function(tweets){
  
  var i = 1;
  var renderLoop = function(){

    var nodeSource = globe.getEcef(tweets[i].latitude, -tweets[i].longitude, 0);

    if (tweets[i].followers_count > 10000 && addEdge) {
      var multi = Math.ceil(tweets[i].followers_count / 10000);
      var color = 'blue';
      for (var j = 0; j < multi; j++) {              
        var nodeTarget = globe.getEcef(tweets[i].latitude + nodeTargetRandom(), -tweets[i].longitude + nodeTargetRandom(), 0);
        globe.drawEdge(nodeSource, nodeTarget, color, true, 5);
      }
      var url = tweets[i].photo;
      // displayPhoto(url, nodeTarget);  // Uncomment to enable displayPhoto IF security disabled
    } else {
      var color = 'orange';
    }
    globe.spark({lat: tweets[i].latitude, lon: -tweets[i].longitude, size: 50, color: color, duration: 2 });
    setTimeout(function(){
      if (i < tweets.length) {
        renderLoop(tweets[i++]);
      }
    }, 150);  // sets 150ms interval between tweets
  }
  renderLoop();
}

////////////////// displays photos flying into space //////////////////

var displayPhoto = function(url, node){
  
  var onComplete = function(object){
    scene.remove(object);
  };
  var pos = camera.position;
  var rnd = Math.random;
  var texture = new Image();
  texture.crossOrigin = "";
  texture.onload = function(){
    var material = new THREE.MeshBasicMaterial( { map: new THREE.Texture(texture), side:THREE.DoubleSide, transparent: true } );
    material.opacity = 0.7;
    var imageGeometry = new THREE.PlaneBufferGeometry(texture.width / 10, texture.height / 10, 1, 1);
    var image = new THREE.Mesh(imageGeometry, material);
    image.position.set( node.position.x,node.position.y,node.position.z );
    image.material.map.needsUpdate = true;
    image.lookAt(camera.position);
    scene.add(image);
    createjs.Tween.get(image.position)
    .to({x: pos.x*(0.9+(rnd()*0.4)), y: pos.y*(0.9+(rnd()*0.4)), z: pos.z*(0.9+(rnd()*0.4))}, 8000)
    .call(onComplete, [image]); 
  };
  texture.src = url;
};