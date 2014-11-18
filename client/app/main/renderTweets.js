//////// simple function to calculate random value between range and -range  ////////

var nodeTargetRandom = function(range){
  return Math.random() * (range - (-range)) + (-range);
}

////////////// renders tweets in order gathered from DB ////////////////

var renderTweets = function(tweets){
  
  var i = 0;
  var followerThreshold = 1000;
  var wordThreshold = 1;
  var speechThreshold = 30;
  
  var renderLoop = function(){
    var nodeSource = globe.getEcef(tweets[i].latitude, -tweets[i].longitude, 0);

    if (i % wordThreshold === 0) {
      postText(tweets[i].text_keywords, tweets[i].isBlacklisted, nodeSource);
    }
    
    // trigger speech synth    
    if (i % speechThreshold === 0) {
      var msg = new SpeechSynthesisUtterance(tweets[i].text_keywords);
      window.speechSynthesis.speak(msg);
    }

    // fires fountains if tweet has more than n followers
    if (tweets[i].followers_count > followerThreshold && addEdge) {
      var numSprouts = Math.ceil(tweets[i].followers_count / followerThreshold);
      var color = 'blue';
      for (var j = 0; j < numSprouts; j++) {              
        var nodeTarget = globe.getEcef(tweets[i].latitude + nodeTargetRandom(20), -tweets[i].longitude + nodeTargetRandom(20), 0);
        globe.drawEdge(nodeSource, nodeTarget, color, true, 5);
      }
      
      if (showPhotos) {
        var url = tweets[i].photo;
        displayPhoto(url, nodeSource);  
      }
      
    } else if (tweets[i].in_reply_to_status_id !== null) {
      var color = 'green';
    } else {
      var color = 'orange';
    }
    
    globe.spark({lat: tweets[i].latitude, lon: -tweets[i].longitude, size: 50, color: color, duration: 2 });
    
    // sets 150ms interval between tweets
    setTimeout(function(){
      if (i < tweets.length) {
        renderLoop(tweets[i++]);
      }
    }, 150);  
    
  }
  renderLoop();
}

///////////////// displays tweets flying into space ////////////////

var postText = function(text, blacklist, node){

  var canvas = document.createElement("canvas");
  var context = canvas.getContext('2d');
  
  context.font = '8pt Calibri';
  
  if (blacklist && showBlacklistedTweets) {
    context.fillStyle = 'red';    
  } else {
    context.fillStyle = 'white';
  }
  
  context.fillText(text, 150, 100);
  
  var pos = camera.position;
  var rnd = Math.random;

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  
  var material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    map: texture
  });
  
  var geo = new THREE.PlaneBufferGeometry(canvas.width, canvas.height, 1, 1);  
  var textMesh = new THREE.Mesh(geo, material);
  
  textMesh.position.set(0, 0, 0)
  textMesh.lookAt(camera.position);
  
  scene.add(textMesh);

  var onComplete = function(object){
    scene.remove(object);
  };
  
  createjs.Tween.get(textMesh.position)
  .to({x: nodeTargetRandom(800)*(0.9+(rnd()*0.4)), y: nodeTargetRandom(800)*(0.9+(rnd()*0.4)), z: nodeTargetRandom(800)*(0.9+(rnd()*0.4))}, 8000)
  .call(onComplete, [textMesh]); 
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
    .to({x: nodeTargetRandom(600)*(0.9+(rnd()*0.4)), y: nodeTargetRandom(600)*(0.9+(rnd()*0.4)), z: nodeTargetRandom(600)*(0.9+(rnd()*0.4))}, 8000)
    .call(onComplete, [image]); 
  };
  
  texture.src = url;
};
