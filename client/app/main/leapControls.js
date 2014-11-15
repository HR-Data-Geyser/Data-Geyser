// $(function() {
// 	var container = document.getElementById('container');
// 	console.log(container);
// 	var width = document.width; 
// 	var height = document.height; 

// 	var leapToScene = function (leapPos) {
// 		// Gets the interaction box of the current frame
// 		var iBox = frame.interactionBox;

// 		// Gets the left border and top border of the box
// 		// In order to convert the position to the proper
// 		// location for the canvas
// 		var left = iBox.center[0] - iBox.size[0]/2;
// 		var top = iBox.center[1] + iBox.size[1]/2;

// 		// Takes our leap coordinates, and changes them so
// 		// that the origin is in the top left corner 
// 		var x = leapPos[0] - left;
// 		var y = leapPos[1] - top;

// 		// Divides the position by the size of the box
// 		// so that x and y values will range from 0 to 1
// 		// as they lay within the interaction box
// 		x /= iBox.size[0];
// 		y /= iBox.size[1];

// 		// Uses the height and width of the canvas to scale
// 		// the x and y coordinates in a way that they 
// 		// take up the entire canvas
// 		x *= width;
// 		y *= height;

// 		// Returns the values, making sure to negate the sign 
// 		// of the y coordinate, because the y basis in canvas 
// 		// points down instead of up
// 		return [ x , -y ];

// 	}

// 	var onSwipe = function(gesture) {
// 		var startPos = leapToScene( gesture.startPosition ); 
// 		var pos = leapToScene( gesture.position); 

// 		console.log('Change the world...'); 
// 		// Manipulate Globe by swiping 

// 	}

// 	var leapController = new Leap.Controller({
// 		enableGestures: true
// 	})
// 	leapController.on( 'animationFrame' , function( frame ) {
// 	  for(var h = 0; h < frame.hands.length; h++){
// 	    var hand = frame.hands[h];

// 	    var swipeHandPos = leapToScene( frame );

// 	    for (var g = 0; g < frame.gestures.length; g++) {
// 	      var gesture = frame.gestures[g]; 

// 	      var type = gesture.type;
// 	      console.log('frame gestures: ', frame.gestures); 

// 	      if (type === 'swipe') {
// 	      	onSwipe(gesture); 
// 	      }
// 	    }
// 	  }
// 	}); 
// }); 
