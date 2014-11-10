var container, stats;
var camera, scene, renderer;
var group;
var mouseX = 0, mouseY = 0;
var leapIsOn = false;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

init();
animate();

function init() {

  container = document.getElementById( 'container' );

  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 2000 );
  camera.position.z = 500;

  scene = new THREE.Scene();

  window.group = new THREE.Group();
  scene.add( group );

  // earth

  var loader = new THREE.TextureLoader();
  loader.load( 'land_ocean_ice_cloud_2048.jpg', function ( texture ) {

    var geometry = new THREE.SphereGeometry( 200, 20, 20 );

    var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );
    var mesh = new THREE.Mesh( geometry, material );
    group.add( mesh );

  } );

  // shadow

  var canvas = document.createElement( 'canvas' );
  canvas.width = 128;
  canvas.height = 128;

  window.context = canvas.getContext( '2d' );
  var gradient = context.createRadialGradient(
    canvas.width / 2,
    canvas.height / 2,
    0,
    canvas.width / 2,
    canvas.height / 2,
    canvas.width / 2
  );
  gradient.addColorStop( 0.1, 'rgba(210,210,210,1)' );
  gradient.addColorStop( 1, 'rgba(255,255,255,1)' );

  context.fillStyle = gradient;
  context.fillRect( 0, 0, canvas.width, canvas.height );

  var texture = new THREE.Texture( canvas );
  texture.needsUpdate = true;

  var geometry = new THREE.PlaneBufferGeometry( 300, 300, 3, 3 );
  var material = new THREE.MeshBasicMaterial( { map: texture, overdraw: 0.5 } );

  var mesh = new THREE.Mesh( geometry, material );
  mesh.position.y = - 250;
  mesh.rotation.x = - Math.PI / 2;
  group.add( mesh );

  renderer = new THREE.CanvasRenderer();
  renderer.setClearColor( 0xffffff );
  renderer.setSize( window.innerWidth, window.innerHeight );

  container.appendChild( renderer.domElement );

  // stats = new Stats();
  // stats.domElement.style.position = 'absolute';
  // stats.domElement.style.top = '0px';
  // container.appendChild( stats.domElement );

  document.addEventListener( 'mousemove', onDocumentMouseMove, false );

  //

  window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

  mouseX = ( event.clientX - windowHalfX );
  mouseY = ( event.clientY - windowHalfY );

}

//

function animate() {

  requestAnimationFrame( animate );

  render();
  //stats.update();

}

function render() {
  
  console.log(leapIsOn);
  if (!leapIsOn) {
    camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
  }

  camera.lookAt( scene.position );

  group.rotation.y -= 0.005;

  renderer.render( scene, camera );

}


//////////////////// LEAP Starts Here ///////////////////////
var controller = new Leap.Controller();

controller.connect();

controller.on('ready', function(){
  leapIsOn = true;
});

controller.on('deviceConnected', function(){
  leapIsOn = true;
})

controller.on('deviceDisconnected', function(){
  leapIsOn = false;
});

var firstValidFrame = null
var cameraRadius = 290
var rotateY = 90, rotateX = 0, curY = 0
var fov = camera.fov;
var data;

function leapToScene(leapPos){
  var iBox = data.interactionBox;

  var left = iBox.center[0] - iBox.size[0]/2;
  var top = iBox.center[1] + iBox.size[1]/2;

  var x = leapPos[0] - left;
  var y = leapPos[1] - top;

  x /= iBox.size[0];
  y /= iBox.size[1];

  x *= windowHalfX;
  y *= windowHalfY;

  return [x, -y];
}

Leap.loop(function(frame) {
  data = frame;
  var earth = group;
  if (frame.valid) {

    //rotate cloud and earth independently
    // clouds.rotation.y+=.002
    earth.rotation.y+=.001

    if (!firstValidFrame) firstValidFrame = frame
    var t = firstValidFrame.translation(frame)

    //limit y-axis between 0 and 180 degrees
    // curY = map(t[1], -300, 300, 0, 179)

    //assign rotation coordinates
    rotateX = t[0]
    // rotateY = -curY
    rotateY = t[1]

    zoom = Math.max(0, t[2] + 200);
    zoomFactor = 2/(1 + (zoom / 150));
    zoomFactor = 1.7;

    //adjust 3D spherical coordinates of the camera
    camera.position.x = earth.position.x + cameraRadius * Math.sin(rotateY * Math.PI/180) * Math.cos(rotateX * Math.PI/180)
    camera.position.z = earth.position.y + cameraRadius * Math.sin(rotateY * Math.PI/180) * Math.sin(rotateX * Math.PI/180)
    camera.position.y = earth.position.z + cameraRadius * Math.cos(rotateY * Math.PI/180)
    camera.fov = fov * zoomFactor;
  }
  
  // loop through hands in each frame
  for (var i = 0; i < frame.hands.length; i++) {

    var hand = frame.hands[i];
    var handPos = leapToScene(hand.palmPosition);

    // for each hand in frame loop through all fingers
    for (var j = 0; j < hand.fingers.length; j++) {
      var finger = hand.fingers[j];

      var fingerPos = leapToScene(finger.tipPosition);

      context.strokeStyle = "#FFA040";
      context.lineWidth = 3;

      context.beginPath();
      context.moveTo(handPos[0], handPos[1]);
      context.lineTo(fingerPos[0], fingerPos[1]);
      context.closePath();
      context.stroke();

      context.strokeStyle = "#39AECF";
      context.lineWidth = 5;
      context.beginPath();
      context.arc(fingerPos[0], fingerPos[1], 20, 0, Math.PI*2);
      context.closePath();
      context.stroke();
    }

    context.fillStyle = "#FF5A40";

    // draw circle for hand
    context.beginPath();
    context.arc(handPos[0], handPos[1], 40, 0, Math.PI*2);
    context.closePath();
    context.fill();
  }

  camera.updateProjectionMatrix();
  camera.lookAt(scene.position)
  renderer.render(scene, camera)
});
