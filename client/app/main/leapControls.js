        /////////// Leap controls ////////////

var leapIsOn = true; 
if (leapIsOn) {
  var leapController = new Leap.Controller({ enableGestures: true });

  leapController.connect();
  
  
  // are these being used?
  var dx = 0.001;
  var dy = 0.001;
  var dz = 0.001;

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
      var scrollSpeed;
      var scaleZoom = zoom - 200;

      var leapScales = {}; 
      if (oculusIsOn) {
        leapScales.lr = 5000;
        leapScales.ud = 10000;
        leapScales.zoom = 12000;
      } else {
        leapScales.lr = 7000;
        leapScales.ud = 12000;
        leapScales.zoom = 15000;
      }

// // CLEANUP TODO: Less hard-code, more params

// // Basic movement with neutral zone

      if(hand.confidence > 0.5 && v < 500){

        if(hand.grabStrength < 0.4){ //hand open
          if(Math.abs(lr) > 80){
            var direction = lr > 0 ? -1 : 1 ;
            scrollSpeed = ( Math.abs(lr) - 80 ) / leapScales.lr;
            orbitControls.rotateLeft(direction * scrollSpeed);
          }
          if(Math.abs(ud) > 80){
            var direction = ud > 0 ? -1 : 1 ;
            scrollSpeed = ( Math.abs(ud) - 80 ) / leapScales.ud;
            orbitControls.rotateUp(direction * scrollSpeed);
          }
          if(scaleZoom < 20 || scaleZoom > 80) {
            var offset = scaleZoom;
            if(offset < 20) {
              scrollSpeed = Math.abs(offset - 20) / leapScales.zoom ;
              orbitControls.dollyIn(1 + scrollSpeed);
            }
            if (offset > 80){
              scrollSpeed = Math.abs(offset - 80) / leapScales.zoom ;
              orbitControls.dollyOut(1.0 + scrollSpeed);
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
        // console.log('frame gestures: ', frame.gestures); 

        if (type === 'swipe') { 
          onSwipe(gesture); 
        }
      }
    }
  });
  var onSwipe = function(gesture, direction, velocity) {

    // console.log('speed ', gesture.speed); 
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