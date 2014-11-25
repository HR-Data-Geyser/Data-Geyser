//////// simple function to calculate random value between range and -range  ////////

var nodeTargetRandom = function(range){
  return Math.random() * (range - (-range)) + (-range);
}

////////////// renders tweets in order gathered from DB ////////////////

var renderTweets = function(tweets){
  
  var i = 0;
  
  var renderLoop = function(){
    var followerThreshold = window.params.followerThreshold; // number of followers needed to trigger a fountain
    var wordThreshold = window.params.wordThreshold; // frequency of tweets that trigger flying text determined via %
    
    // converts tweet lat/long to [x, y, z] coordinates 
    var nodeSource = globe.getEcef(tweets[i].latitude, -tweets[i].longitude, 0);

    if (i % wordThreshold === 0) {
      postText(tweets[i].text_keywords, tweets[i].isBlacklisted, nodeSource);
    }

    // fires fountains if tweet has more than n followers
    if (tweets[i].followers_count > followerThreshold && params.addEdge) {
      
      // adds sprout to fountain for each multiple of followerThreshold
      var numSprouts = Math.ceil(tweets[i].followers_count / followerThreshold);
      var color = 'blue';
      for (var j = 0; j < numSprouts; j++) {              
        
        // sets random target coordinates within 20 lat long of source
        var nodeTarget = globe.getEcef(tweets[i].latitude + nodeTargetRandom(20), -tweets[i].longitude + nodeTargetRandom(20), 0);
        globe.drawEdge(nodeSource, nodeTarget, color, true, 5);
      }
      
      // checks for showPhotos tag to enable photos due to CORS issues
      if (params.showPhotos) {
        var url = tweets[i].photo;
        displayPhoto(url, nodeSource);  
      }
      
    } else if (tweets[i].in_reply_to_status_id !== null) {
      var color = 'green';
    } else {
      var color = 'orange';
    }
    
    // places spark on globe at correct lat/long coordinates
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

  context.font = '10pt Calibri';
  
  // checks text for offensive words and highlights red if showBlacklisted is active
  if (blacklist && params.showOffensive) {
    context.fillStyle = 'red';    
  } else {
    context.fillStyle = 'white';
  }
  
  context.fillText(text, 150, 100);


  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  
  var material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    map: texture,
    depthWrite: false
  });
  
  var geo = new THREE.PlaneBufferGeometry(canvas.width, canvas.height, 1, 1);  
  var textMesh = new THREE.Mesh(geo, material);
  
  // sets origin at center of globe with starting position towards camera
  textMesh.position.set(0, 0, 0);
  textMesh.lookAt(camera.position);
  
  scene.add(textMesh);

  var onComplete = function(){
    scene.remove(textMesh);
  };
  
  // basic tween to transition mesh to random x,y,z coordinates

  new TWEEN.Tween(textMesh.position)
      .to({x: nodeTargetRandom(800), y: nodeTargetRandom(800), z: nodeTargetRandom(800)}, 8000)
      .onComplete(function(){
        scene.remove(textMesh);
      })
      .start();
}

////////////////// displays photos flying into space //////////////////

var displayPhoto = function(url, node){
  
  var pos = camera.position;
  var rnd = Math.random;
  var texture = new Image();
  texture.crossOrigin = "";
  
  texture.onload = function(){
    var material = new THREE.MeshBasicMaterial( { map: new THREE.Texture(texture), side:THREE.DoubleSide, transparent: true } );
    material.opacity = 0.7;
    var imageGeometry = new THREE.PlaneBufferGeometry(texture.width / 5, texture.height / 5, 1, 1);
    var image = new THREE.Mesh(imageGeometry, material);
    
    // sets origin to x,y,z coordinates based on geo data from tweet
    image.position.set( node.position.x, node.position.y, node.position.z );
    image.material.map.needsUpdate = true;
    image.lookAt(camera.position);
    scene.add(image);
    
    // basic tween to transition mesh to random x,y,z coordinates in vicinity of camera position at time of instantiation
    new TWEEN.Tween(image.position)
        .to({x: pos.x*(0.9+(rnd()*0.4)), y: pos.y*(0.9+(rnd()*0.4)), z: pos.z*(0.9+(rnd()*0.4))}, 8000)
        .onComplete(function(){
          scene.remove(image)
        })
        .start();
  };
  
  texture.src = url;
};
