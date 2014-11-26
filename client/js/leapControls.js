        /////////// Leap controls ////////////

var leapController = new Leap.Controller({ enableGestures: true });

var leapIsOn = true; 
// var oculusIsOn = false; 
 
if (leapIsOn) {

  console.log('LEEAAAPP'); 
  leapController.connect();

  leapController.on( 'animationFrame' , function( frame ) {


    for(var h = 0; h < frame.hands.length; h++){

      frame = frame; 
      var hand = frame.hands[h];
      window.hand = hand;
      var position = hand.palmPosition;
      var direction = hand.direction;

      // Left-right rotation - Leap x-axis
      var lr = hand.palmPosition[0];
      // Up-down rotation - Leap z-axis
      var ud = hand.palmPosition[2];
      // Zoom position - Leap y-axis
      var zoom = hand.palmPosition[1];

      // Scale y-axis to make controls more comfortable
      var scaleZoom = zoom - 200;
      var vel = hand.palmVelocity;
      var v = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2]);
      var scrollSpeed;

      var leapBoxLimits = {}; 

      // Set different Leap control settings if Oculus-enabled
      if ( oculusIsOn ) {
        leapBoxLimits.lr = 40; 
        leapBoxLimits.ud = 40;
        leapBoxLimits.zoomIn = 20;
        leapBoxLimits.zoomOut = 40;
      } else {
        leapBoxLimits.lr = 80; 
        leapBoxLimits.ud = 70;
        leapBoxLimits.zoomIn = 20;
        leapBoxLimits.zoomOut = 70;
      }

      var leapSpeed = {}; 
      if ( oculusIsOn ) {
        leapSpeed.lr = 5000;
        leapSpeed.ud = 10000;
        leapSpeed.zoom = 12000;
      } else {
        leapSpeed.lr = 7000;
        leapSpeed.ud = 12000;
        leapSpeed.zoom = 15000;
      }

// // CLEANUP TODO: Less hard-code, more params

// // Basic movement with neutral zone

      // Confidence greater than 0.5 and speed less than 500 prevents misunderstandings
      if(hand.confidence > 0.5 && v < 500){
        console.log('leapBoxLimits ', leapBoxLimits.lr);

        // Hand is open (not grabbing) and thus intending to move globe
        if(hand.grabStrength < 0.4){ 

          // When handPosition is greater than a limit, the globe moves that direction
          // Multi-directional movement is allowed with cascading 'if' statements with no 'else'
          if( Math.abs(lr) > leapBoxLimits.lr ){
            var direction = lr > 0 ? -1 : 1 ;
            scrollSpeed = ( Math.abs(lr) - leapBoxLimits.lr ) / leapSpeed.lr;
            orbitControls.rotateLeft(direction * scrollSpeed);
          }
          if( Math.abs(ud) > leapBoxLimits.ud ){
            var direction = ud > 0 ? -1 : 1 ;
            scrollSpeed = ( Math.abs(ud) - leapBoxLimits.ud ) / leapSpeed.ud;
            orbitControls.rotateUp(direction * scrollSpeed);
          }
          if( scaleZoom < leapBoxLimits.zoomIn || scaleZoom > leapBoxLimits.zoomOut ) {

            if(scaleZoom < leapBoxLimits.zoomIn) {
              scrollSpeed = Math.abs(scaleZoom - leapBoxLimits.zoomIn) / leapSpeed.zoom ;
              orbitControls.dollyIn(1 + scrollSpeed);
            }
            if (scaleZoom > leapBoxLimits.zoomOut){
              scrollSpeed = Math.abs(scaleZoom - leapBoxLimits.zoomOut) / leapSpeed.zoom ;
              orbitControls.dollyOut(1 + scrollSpeed);
            }
          }
          orbitControls.update()
        }
        if(hand.grabStrength > 0.8){

          if(nextFuncReady){
            nextFuncReady = false;
            setTimeout(function(){nextFuncReady = true;}, 10000);
          }
        }
      }

// Check for gestures
      for (var g = 0; g < frame.gestures.length; g++) {
        var gesture = frame.gestures[g]; 

        var type = gesture.type;

        if (type === 'swipe') { 
          onSwipe(gesture); 
        }
      }
    }
  });

  // Manipulate Globe by swiping 
  var onSwipe = function(gesture, direction, velocity) {

    velocity = gesture.speed; 


    orbitControls.autoRotate = true; 

  // TweenJS takes care of timing of this rotation
    var tween = new TWEEN.Tween({ speed: velocity / 15 }) // TODO: play with velocity scales
      .to({speed: 0}, 10000)
      .easing(TWEEN.Easing.Circular.Out)
      .onUpdate(function() {
        orbitControls.autoRotateSpeed = this.speed;
      })
      .onComplete(function() {

        // orbitControls.autoRotate = false;  // 
      })
      .start(); 
  }
}