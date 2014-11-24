        /////////// Leap controls ////////////

var leapController = new Leap.Controller({ enableGestures: true });

var leapIsOn = true; 
// var oculusIsOn = false; 
 
if (leapIsOn) {

  console.log('LEEAAAPP'); 
  leapController.connect();


  leapController.on( 'animationFrame' , function( frame ) {


      ////////////// Autopilot command will go here //////////////////
    // if (frame.hands.length === 2) {
    //   var handOne = frame.hands[0];
    //   var handTwo = frame.hands[1];
    //
    //   var directionOne = handOne.direction;
    //   var directionTwo = handTwo.direction;
    //
    //   if ((Math.abs(directionOne[0]) + Math.abs(directionTwo[0])) > 0.5) {
    //     console.log((Math.abs(directionOne[0]) + Math.abs(directionTwo[0])));
    //   }
    //
    // }

    for(var h = 0; h < frame.hands.length; h++){

      frame = frame; 
      var hand = frame.hands[h];
      window.hand = hand;
      var position = hand.palmPosition;
      var direction = hand.direction;
      var timer = new Date().getTime() * 0.0005; // is this being used?
      var lr = hand.palmPosition[0];
      var ud = hand.palmPosition[2];
      var zoom = hand.palmPosition[1];
      var vel = hand.palmVelocity;
      var v = Math.sqrt(vel[0] * vel[0] + vel[1] * vel[1] + vel[2] * vel[2]);
      var scaleZoom = zoom - 200;
      var scrollSpeed;

      var leapBoxLimits = {}; 


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

      console.log('position: ', hand.palmPosition); 

      if(hand.confidence > 0.5 && v < 500){

        if(hand.grabStrength < 0.4){ //hand open
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
            var offset = scaleZoom;
            if(offset < leapBoxLimits.zoomIn) {
              scrollSpeed = Math.abs(offset - leapBoxLimits.zoomIn) / leapSpeed.zoom ;
              orbitControls.dollyIn(1 + scrollSpeed);
            }
            if (offset > leapBoxLimits.zoomOut){
              scrollSpeed = Math.abs(offset - leapBoxLimits.zoomOut) / leapSpeed.zoom ;
              orbitControls.dollyOut(1 + scrollSpeed);
            }
          }
          orbitControls.update()
        }
        if(hand.grabStrength > 0.8){

          if(nextFuncReady){
            // getTweets();
            nextFuncReady = false;
            setTimeout(function(){nextFuncReady = true;}, 10000);
          }
        }
      }

// // Check for gestures
      for (var g = 0; g < frame.gestures.length; g++) {
        var gesture = frame.gestures[g]; 

        var type = gesture.type;

        if (type === 'swipe') { 
          onSwipe(gesture); 
        }
      }
    }
  });
  var onSwipe = function(gesture, direction, velocity) {

    velocity = gesture.speed; 

  // Manipulate Globe by swiping 
  // TweenJS takes care of timing of this rotation

    orbitControls.autoRotate = true; 

  // TODO: play with velocity scales
    var tween = new TWEEN.Tween({ speed: velocity / 15 })
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