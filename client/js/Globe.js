/**
 * @author qiao / https://github.com/qiao
 * @author mrdoob / http://mrdoob.com
 * @author alteredq / http://alteredqualia.com/
 * @author WestLangley / http://github.com/WestLangley
 * @author erich666 / http://erichaines.com
 * @author mrflix / http://felixniklas.de
 */
/*global THREE, console */
 
// This set of controls performs orbiting, dollying (zooming), and panning. It maintains
// the "up" direction as +Y, unlike the TrackballControls. Touch on tablet and phones is
// supported.
//
//    Orbit - left mouse / touch: one finger move
//    Zoom - middle mouse, or mousewheel / touch: two finger spread or squish
//    Pan - right mouse, or arrow keys / touch: three finter swipe
//
// This is a drop-in replacement for (most) TrackballControls used in examples.
// That is, include this js file and wherever you see:
//    	controls = new THREE.TrackballControls( camera );
//      controls.target.z = 150;
// Simple substitute "OrbitControls" and the control should work as-is.
 
THREE.OrbitControls = function ( object, domElement, localElement ) {
 
	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.localElement = ( localElement !== undefined ) ? localElement : document;
 
	// API
 
	// Set to false to disable this control
	this.enabled = true;
 
	// "target" sets the location of focus, where the control orbits around
	// and where it pans with respect to.
	this.target = new THREE.Vector3();
	// center is old, deprecated; use "target" instead
	this.center = this.target;
 
	// This option actually enables dollying in and out; left as "zoom" for
	// backwards compatibility
	this.noZoom = false;
	this.zoomSpeed = 1.0;
	// Limits to how far you can dolly in and out
	this.minDistance = 0;
	this.maxDistance = Infinity;
 
	// Set to true to disable this control
	this.noRotate = false;
	this.rotateSpeed = 1.0;
 
	// Set to true to disable this control
	this.noPan = false;
	this.keyPanSpeed = 7.0;	// pixels moved per arrow key push
 
	// Set to true to automatically rotate around the target
	this.autoRotate = false;
	this.autoRotateSpeed = 2.0; // 30 seconds per round when fps is 60
 
	// How far you can orbit vertically, upper and lower limits.
	// Range is 0 to Math.PI radians.
	this.minPolarAngle = 0; // radians
	this.maxPolarAngle = Math.PI; // radians
 
	// Set to true to disable use of the keys
	this.noKeys = false;
	// The four arrow keys
	this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
 
	////////////
	// internals
 
	var scope = this;
 
	var EPS = 0.000001;
 
	var rotateStart = new THREE.Vector2();
	var rotateEnd = new THREE.Vector2();
	var rotateDelta = new THREE.Vector2();
 
	var panStart = new THREE.Vector2();
	var panEnd = new THREE.Vector2();
	var panDelta = new THREE.Vector2();
 
	var dollyStart = new THREE.Vector2();
	var dollyEnd = new THREE.Vector2();
	var dollyDelta = new THREE.Vector2();
 
	var phiDelta = 0;
	var thetaDelta = 0;
	var scale = 1;
	var pan = new THREE.Vector3();
 
	var lastPosition = new THREE.Vector3();
 
	var STATE = { NONE : -1, ROTATE : 0, DOLLY : 1, PAN : 2, TOUCH_ROTATE : 3, TOUCH_DOLLY : 4, TOUCH_PAN : 5 };
	var state = STATE.NONE;
 
	// events
 
	var changeEvent = { type: 'change' };
 
 
	this.rotateLeft = function ( angle ) {
 
		if ( angle === undefined ) {
 
			angle = getAutoRotationAngle();
 
		}
 
		thetaDelta -= angle;
 
	};
 
	this.rotateUp = function ( angle ) {
 
		if ( angle === undefined ) {
 
			angle = getAutoRotationAngle();
 
		}
 
		phiDelta -= angle;
 
	};
 
	// pass in distance in world space to move left
	this.panLeft = function ( distance ) {
 
		var panOffset = new THREE.Vector3();
		var te = this.object.matrix.elements;
		// get X column of matrix
		panOffset.set( te[0], te[1], te[2] );
		panOffset.multiplyScalar(-distance);
		
		pan.add( panOffset );
 
	};
 
	// pass in distance in world space to move up
	this.panUp = function ( distance ) {
 
		var panOffset = new THREE.Vector3();
		var te = this.object.matrix.elements;
		// get Y column of matrix
		panOffset.set( te[4], te[5], te[6] );
		panOffset.multiplyScalar(distance);
		
		pan.add( panOffset );
	};
	
	// main entry point; pass in Vector2 of change desired in pixel space,
	// right and down are positive
	this.pan = function ( delta ) {
 
		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
 
		if ( scope.object.fov !== undefined ) {
 
			// perspective
			var position = scope.object.position;
			var offset = position.clone().sub( scope.target );
			var targetDistance = offset.length();
 
			// half of the fov is center to top of screen
			targetDistance *= Math.tan( (scope.object.fov/2) * Math.PI / 180.0 );
			// we actually don't use screenWidth, since perspective camera is fixed to screen height
			scope.panLeft( 2 * delta.x * targetDistance / element.clientHeight );
			scope.panUp( 2 * delta.y * targetDistance / element.clientHeight );
 
		} else if ( scope.object.top !== undefined ) {
 
			// orthographic
			scope.panLeft( delta.x * (scope.object.right - scope.object.left) / element.clientWidth );
			scope.panUp( delta.y * (scope.object.top - scope.object.bottom) / element.clientHeight );
 
		} else {
 
			// camera neither orthographic or perspective - warn user
			console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - pan disabled.' );
 
		}
 
	};
 
	this.dollyIn = function ( dollyScale ) {
 
		if ( dollyScale === undefined ) {
 
			dollyScale = getZoomScale();
 
		}
 
		scale /= dollyScale;
 
	};
 
	this.dollyOut = function ( dollyScale ) {
 
		if ( dollyScale === undefined ) {
 
			dollyScale = getZoomScale();
 
		}
 
		scale *= dollyScale;
 
	};
 
	this.update = function () {
 
		var position = this.object.position;
		var offset = position.clone().sub( this.target );
 
		// angle from z-axis around y-axis
 
		var theta = Math.atan2( offset.x, offset.z );
 
		// angle from y-axis
 
		var phi = Math.atan2( Math.sqrt( offset.x * offset.x + offset.z * offset.z ), offset.y );
 
		if ( this.autoRotate ) {
 
			this.rotateLeft( getAutoRotationAngle() );
 
		}
 
		theta += thetaDelta;
		phi += phiDelta;
 
		// restrict phi to be between desired limits
		phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, phi ) );
 
		// restrict phi to be betwee EPS and PI-EPS
		phi = Math.max( EPS, Math.min( Math.PI - EPS, phi ) );
 
		var radius = offset.length() * scale;
 
		// restrict radius to be between desired limits
		radius = Math.max( this.minDistance, Math.min( this.maxDistance, radius ) );
		
		// move target to panned location
		this.target.add( pan );
 
		offset.x = radius * Math.sin( phi ) * Math.sin( theta );
		offset.y = radius * Math.cos( phi );
		offset.z = radius * Math.sin( phi ) * Math.cos( theta );
 
		position.copy( this.target ).add( offset );
 
		this.object.lookAt( this.target );
 
		thetaDelta = 0;
		phiDelta = 0;
		scale = 1;
		pan.set(0,0,0);
 
		if ( lastPosition.distanceTo( this.object.position ) > 0 ) {
 
			this.dispatchEvent( changeEvent );
 
			lastPosition.copy( this.object.position );
 
		}
 
	};
 
 
	function getAutoRotationAngle() {
 
		return 2 * Math.PI / 60 / 60 * scope.autoRotateSpeed;
 
	}
 
	function getZoomScale() {
 
		return Math.pow( 0.95, scope.zoomSpeed );
 
	}
 
	function onMouseDown( event ) {
 
		if ( scope.enabled === false ) { return; }
		event.preventDefault();
 
		if ( event.button === 0 ) {
			if ( scope.noRotate === true ) { return; }
 
			state = STATE.ROTATE;
 
			rotateStart.set( event.clientX, event.clientY );
 
		} else if ( event.button === 1 ) {
			if ( scope.noZoom === true ) { return; }
 
			state = STATE.DOLLY;
 
			dollyStart.set( event.clientX, event.clientY );
 
		} else if ( event.button === 2 ) {
			if ( scope.noPan === true ) { return; }
 
			state = STATE.PAN;
 
			panStart.set( event.clientX, event.clientY );
 
		}
 
		// Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
		scope.domElement.addEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.addEventListener( 'mouseup', onMouseUp, false );
 
	}
 
	function onMouseMove( event ) {
 
		if ( scope.enabled === false ) return;
 
		event.preventDefault();
 
		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
 
		if ( state === STATE.ROTATE ) {
 
			if ( scope.noRotate === true ) return;
 
			rotateEnd.set( event.clientX, event.clientY );
			rotateDelta.subVectors( rotateEnd, rotateStart );
 
			// rotating across whole screen goes 360 degrees around
			scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
			// rotating up and down along whole screen attempts to go 360, but limited to 180
			scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );
 
			rotateStart.copy( rotateEnd );
 
		} else if ( state === STATE.DOLLY ) {
 
			if ( scope.noZoom === true ) return;
 
			dollyEnd.set( event.clientX, event.clientY );
			dollyDelta.subVectors( dollyEnd, dollyStart );
 
			if ( dollyDelta.y > 0 ) {
 
				scope.dollyIn();
 
			} else {
 
				scope.dollyOut();
 
			}
 
			dollyStart.copy( dollyEnd );
 
		} else if ( state === STATE.PAN ) {
 
			if ( scope.noPan === true ) return;
 
			panEnd.set( event.clientX, event.clientY );
			panDelta.subVectors( panEnd, panStart );
			
			scope.pan( panDelta );
 
			panStart.copy( panEnd );
 
		}
 
		// Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
		scope.update();
 
	}
 
	function onMouseUp( /* event */ ) {
 
		if ( scope.enabled === false ) return;
 
		// Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
		scope.domElement.removeEventListener( 'mousemove', onMouseMove, false );
		scope.domElement.removeEventListener( 'mouseup', onMouseUp, false );
 
		state = STATE.NONE;
 
	}
 
	function onMouseWheel( event ) {
 
		if ( scope.enabled === false || scope.noZoom === true ) return;
 
		var delta = 0;
 
		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9
 
			delta = event.wheelDelta;
 
		} else if ( event.detail ) { // Firefox
 
			delta = - event.detail;
 
		}
 
		if ( delta > 0 ) {
 
			scope.dollyOut();
 
		} else {
 
			scope.dollyIn();
 
		}
 
	}
 
	function onKeyDown( event ) {
 
		if ( scope.enabled === false ) { return; }
		if ( scope.noKeys === true ) { return; }
		if ( scope.noPan === true ) { return; }
 
		// pan a pixel - I guess for precise positioning?
		// Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
		var needUpdate = false;
		
		switch ( event.keyCode ) {
 
			case scope.keys.UP:
				scope.pan( new THREE.Vector2( 0, scope.keyPanSpeed ) );
				needUpdate = true;
				break;
			case scope.keys.BOTTOM:
				scope.pan( new THREE.Vector2( 0, -scope.keyPanSpeed ) );
				needUpdate = true;
				break;
			case scope.keys.LEFT:
				scope.pan( new THREE.Vector2( scope.keyPanSpeed, 0 ) );
				needUpdate = true;
				break;
			case scope.keys.RIGHT:
				scope.pan( new THREE.Vector2( -scope.keyPanSpeed, 0 ) );
				needUpdate = true;
				break;
		}
 
		// Greggman fix: https://github.com/greggman/three.js/commit/fde9f9917d6d8381f06bf22cdff766029d1761be
		if ( needUpdate ) {
 
			scope.update();
 
		}
 
	}
	
	function touchstart( event ) {
 
		if ( scope.enabled === false ) { return; }
 
		switch ( event.touches.length ) {
 
			case 1:	// one-fingered touch: rotate
				if ( scope.noRotate === true ) { return; }
 
				state = STATE.TOUCH_ROTATE;
 
				rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;
 
			case 2:	// two-fingered touch: dolly
				if ( scope.noZoom === true ) { return; }
 
				state = STATE.TOUCH_DOLLY;
 
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				var distance = Math.sqrt( dx * dx + dy * dy );
				dollyStart.set( 0, distance );
				break;
 
			case 3: // three-fingered touch: pan
				if ( scope.noPan === true ) { return; }
 
				state = STATE.TOUCH_PAN;
 
				panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				break;
 
			default:
				state = STATE.NONE;
 
		}
	}
 
	function touchmove( event ) {
 
		if ( scope.enabled === false ) { return; }
 
		event.preventDefault();
		event.stopPropagation();
 
		var element = scope.domElement === document ? scope.domElement.body : scope.domElement;
 
		switch ( event.touches.length ) {
 
			case 1: // one-fingered touch: rotate
				if ( scope.noRotate === true ) { return; }
				if ( state !== STATE.TOUCH_ROTATE ) { return; }
 
				rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				rotateDelta.subVectors( rotateEnd, rotateStart );
 
				// rotating across whole screen goes 360 degrees around
				scope.rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientWidth * scope.rotateSpeed );
				// rotating up and down along whole screen attempts to go 360, but limited to 180
				scope.rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight * scope.rotateSpeed );
 
				rotateStart.copy( rotateEnd );
				break;
 
			case 2: // two-fingered touch: dolly
				if ( scope.noZoom === true ) { return; }
				if ( state !== STATE.TOUCH_DOLLY ) { return; }
 
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				var distance = Math.sqrt( dx * dx + dy * dy );
 
				dollyEnd.set( 0, distance );
				dollyDelta.subVectors( dollyEnd, dollyStart );
 
				if ( dollyDelta.y > 0 ) {
 
					scope.dollyOut();
 
				} else {
 
					scope.dollyIn();
 
				}
 
				dollyStart.copy( dollyEnd );
				break;
 
			case 3: // three-fingered touch: pan
				if ( scope.noPan === true ) { return; }
				if ( state !== STATE.TOUCH_PAN ) { return; }
 
				panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );
				panDelta.subVectors( panEnd, panStart );
				
				scope.pan( panDelta );
 
				panStart.copy( panEnd );
				break;
 
			default:
				state = STATE.NONE;
 
		}
 
	}
 
	function touchend( /* event */ ) {
 
		if ( scope.enabled === false ) { return; }
 
		state = STATE.NONE;
	}
 
	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );
	this.localElement.addEventListener( 'mousedown', onMouseDown, false );
	this.domElement.addEventListener( 'mousewheel', onMouseWheel, false );
	this.domElement.addEventListener( 'DOMMouseScroll', onMouseWheel, false ); // firefox
 
	this.domElement.addEventListener( 'keydown', onKeyDown, false );
 
	this.localElement.addEventListener( 'touchstart', touchstart, false );
	this.domElement.addEventListener( 'touchend', touchend, false );
	this.domElement.addEventListener( 'touchmove', touchmove, false );
 
};
 
THREE.OrbitControls.prototype = Object.create( THREE.EventDispatcher.prototype );








var container, stats;
var camera, scene, renderer, orbitControls;
var group;
var mouseX = 0, mouseY = 0;
var leapIsOn = true;

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
}

function render() {
  
  if (!leapIsOn) {
    camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
  }

  camera.lookAt( scene.position );

  group.rotation.y -= 0.005;

  renderer.render( scene, camera );

}


//////////////////// LEAP Starts Here ///////////////////////
// var controller = new Leap.Controller({enableGestures: true});
//
// controller.connect();
//
// controller.on('ready', function(){
//   leapIsOn = true;
// });
//
// controller.on('deviceConnected', function(){
//   leapIsOn = true;
// })
//
// controller.on('deviceDisconnected', function(){
//   leapIsOn = false;
// });
//
// var firstValidFrame = null
// var cameraRadius = 290
// var rotateY = 90, rotateX = 0
// var fov = camera.fov;
// var data;
// var zoomFactor;
//
// function leapToScene(leapPos){
//   var iBox = data.interactionBox;
//
//   var left = iBox.center[0] - iBox.size[0]/2;
//   var top = iBox.center[1] + iBox.size[1]/2;
//
//   var x = leapPos[0] - left;
//   var y = leapPos[1] - top;
//
//   x /= iBox.size[0];
//   y /= iBox.size[1];
//
//   x *= windowHalfX;
//   y *= windowHalfY;
//
//   return [x, -y];
// }
//
// function swipeFunction(){
//   console.log('swipe')
//
// }
//
// Leap.loop(function(frame) {
//   data = frame;
//   context.clearRect(0, 0, windowHalfX, windowHalfY);
//   var earth = group;
//   if (frame.valid && frame.hands.length > 0) {
//
//     //rotate cloud and earth independently
//     // clouds.rotation.y+=.002
//     earth.rotation.y = 0;
//
//     if (!firstValidFrame) firstValidFrame = frame
//     var t = firstValidFrame.translation(frame)
//
//     //assign rotation coordinates
//     if (frame.pointables.length === 2){
//       rotateX = t[0]
//       rotateY = t[1]/2;
//     }
//
//     if (frame.pointables.length === 1) {
//       zoom = Math.max(0, t[2] + 200);
//       zoomFactor = 2/(1 + (zoom / 150)) * 2;
//       if (zoomFactor > 2.5) {
//         zoomFactor = 2.5;
//       } else if (zoomFactor < 0.5) {
//         zoomFactor = 0.5;
//       }
//     }
//
//     //adjust 3D spherical coordinates of the camera
//     camera.position.x = earth.position.x + cameraRadius * Math.sin(rotateY * Math.PI/180) * Math.cos(rotateX * Math.PI/180)
//     camera.position.z = earth.position.y + cameraRadius * Math.sin(rotateY * Math.PI/180) * Math.sin(rotateX * Math.PI/180)
//     camera.position.y = earth.position.z + cameraRadius * Math.cos(rotateY * Math.PI/180)
//     camera.fov = fov * zoomFactor;
//   }
//
//   for (var i = 0; i < frame.gestures.length; i++) {
//     if (frame.gestures[i].type === "swipe") {
//       swipeFunction();
//     }
//   }
//
//   // loop through hands in each frame
//   for (var i = 0; i < frame.hands.length; i++) {
//     var hand = frame.hands[i];
//     var handPos = leapToScene(hand.palmPosition);
//
//     // for each hand in frame loop through all fingers
//     for (var j = 0; j < hand.fingers.length; j++) {
//       var finger = hand.fingers[j];
//
//       var fingerPos = leapToScene(finger.tipPosition);
//
//       context.strokeStyle = "#FFA040";
//       context.lineWidth = 3;
//
//       context.beginPath();
//       context.moveTo(handPos[0], handPos[1]);
//       context.lineTo(fingerPos[0], fingerPos[1]);
//       context.closePath();
//       context.stroke();
//
//       context.strokeStyle = "#39AECF";
//       context.lineWidth = 5;
//       context.beginPath();
//       context.arc(fingerPos[0], fingerPos[1], 20, 0, Math.PI*2);
//       context.closePath();
//       context.stroke();
//     }
//
//     context.fillStyle = "#FF5A40";
//
//     // draw circle for hand
//     context.beginPath();
//     context.arc(handPos[0], handPos[1], 40, 0, Math.PI*2);
//     context.closePath();
//     context.fill();
//   }
//
//   camera.updateProjectionMatrix();
//   camera.lookAt(scene.position)
//   renderer.render(scene, camera)
// });
//
orbitControls = new THREE.OrbitControls(camera);
orbitControls.addEventListener( 'change', render );
orbitControls.minDistance = 8000;
orbitControls.maxDistance = 50000;

window.orbitControls = orbitControls;

if (leapIsOn) {
  leapController = new Leap.Controller({ enableGestures: false });
  leapController.connect();
  // leapController.on( 'connect' , onControllerConnect);

  var dx = 0.001;
  var dy = 0.001;
  var dz = 0.001;

  leapController.on( 'animationFrame' , function( frame ) {

    var xHandMin = -300.0;
    var xHandMax = 300.0;
    var yHandMin = 15.0;
    var yHandMax = 400.0;
    var zHandMin = -200.0;
    var zHandMax = 200.0;

    var xCamMin = -20000.0;
    var xCamMax = 20000.0;
    var yCamMin = -20000.0;
    var yCamMax = 20000.0;
    var zCamMin = -10000.0;
    var zCamMax = 40000.0;

    for(var h = 0; h < frame.hands.length; h++){
      var hand = frame.hands[h];
      window.hand = hand;
      var position = hand.palmPosition;
      var direction = hand.direction;
      var timer = new Date().getTime() * 0.0005;

      var lr = hand.palmPosition[0];
      var ud = hand.palmPosition[2];
      var zoom = hand.palmPosition[1];
      var vel = hand.palmVelocity;
      var v = Math.sqrt(vel[0]*vel[0]+vel[1]*vel[1]+vel[2]*vel[2]);
      // console.log(v);
      // console.log(hand.confidence);

      if(hand.confidence > 0.5 && v < 400){
        if(hand.pinchStrength< 0.4){ //hand open
          if(Math.abs(lr)>80){
            orbitControls.rotateLeft(0.01 * lr / Math.abs(lr));
          }else if(Math.abs(ud) > 80){
            var offset = ud;
            orbitControls.rotateUp(0.01 * offset / Math.abs(offset));
          }else if(Math.abs(zoom - 250)> 50){
            var offset = zoom - 250;
            if(offset > 0) {
              orbitControls.zoomIn(1.01);
            } else {
              orbitControls.zoomOut(1.01);
            }
          }
        }else if(hand.pinchStrength > 0.8){
          if(nextFuncReady){
            if(nextFunc == undefined)
              initNextFunc();
            nextFunc();
            nextFuncReady = false;
            setTimeout(function(){nextFuncReady = true;}, 10000);
          }
        }
      }
    }

  });
}