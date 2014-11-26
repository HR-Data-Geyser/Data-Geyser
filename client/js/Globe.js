var Globe = function (r) {
  THREE.Object3D.call(this);
  this.flattening = 1.0 / 298.257223563;
  this.equatorialRadius = r;
  this.polarRadius = this.equatorialRadius * (1.0 - this.flattening);

  var geo = new THREE.SphereGeometry(r, 72, 36);
  geo.applyMatrix(new THREE.Matrix4().scale(new THREE.Vector3(1.0, 1.0 - this.flattening, 1.0)));


  var bmng = THREE.ImageUtils.loadTexture('../assets/images/earth/bmng.png');
  bmng.wrapS = bmng.wrapT = THREE.RepeatWrapping;
  var spec = THREE.ImageUtils.loadTexture('../assets/images/earth/spec.png');
  spec.wrapS = spec.wrapT = THREE.RepeatWrapping;
  var norm = THREE.ImageUtils.loadTexture('../assets/images/earth/norm.png');
  norm.wrapS = norm.wrapT = THREE.RepeatWrapping;

  bmng.anisotropy = spec.anisotropy = norm.anisotropy = 2;
  bmng.offset.set(0, 0);
  spec.offset.set(0, 0);
  norm.offset.set(0, 0);

  var mat = new THREE.MeshPhongMaterial({
    shininess  : 50,
    map        : bmng,
    normalMap  : norm,
    specularMap: spec
  });

  // testing wireframe
  //mat = new THREE.MeshBasicMaterial({color: 'red', wireframe: true});

  var mesh = new THREE.Mesh(geo, mat);
  this.add(mesh);

  var pc_mat = new THREE.ShaderMaterial({
    uniforms: {
      color: {type: 'c', value: new THREE.Color(0xffffff)},
      texture: {type: 't', value: THREE.ImageUtils.loadTexture('../assets/images/spark.png')}
    },
    attributes: {
      flashSize: {type: 'f', value: []},
      cc: {type: 'c', value: []}
    },
    vertexShader: [
      'attribute float flashSize;',
      'attribute vec3 cc;',
      'varying vec3 vColor;',
      'void main() {',
      ' vColor = cc;',
      ' vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
      ' gl_PointSize = flashSize * (300.0 / length(mvPosition.xyz));',
      ' gl_Position = projectionMatrix * mvPosition;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 color;',
      'uniform sampler2D texture;',
      'varying vec3 vColor;',
      'void main() {',
      ' gl_FragColor = vec4(color * vColor, 1.0);',
      ' gl_FragColor = gl_FragColor * texture2D(texture, gl_PointCoord);',
      '}'
    ].join('\n'),
    blending: THREE.AdditiveBlending,
    depthTest: true,
    transparent: true
  });
  var pc_geo = new THREE.Geometry();
  for (var i = 0; i < 1000; i++){
    pc_geo.vertices.push(new THREE.Vector3());
    pc_mat.attributes.cc.value.push(new THREE.Color());
    pc_mat.attributes.flashSize.value.push(0);
  }
  //for ( var i = 0; i < 100; i ++ ) {
  //
  //  var lat = Math.random() * 180 - 90;
  //  var lon = Math.random() * 360 -180;
  //  var alt = 8;
  //  var vertex = this.geoToEcef(lat, lon, alt);
  //  pc_geo.vertices.push( vertex );
  //  attributes.size.value[ i ] = 300;
  //  attributes.customColor.value[ i ] = new THREE.Color( 0xffaa00 );
  //  if (vertex.x < 0) {
  //    attributes.customColor.value[i].setHSL(0.5 + 0.1 * (i/100), 0.7, 0.5);
  //  } else {
  //    attributes.customColor.value[i].setHSL(0.0 + 0.1 * (i/100), 0.9, 0.5);
  //  }
  //}
  //mesh.visible = false;
  this.pc = new THREE.PointCloud(pc_geo, pc_mat);
  this.pc.sortParticles = true;
  this.pc.dynamic = true;
  this.pc.numParticles = 0;
  this.pc.visible = false;
  this.add(this.pc);
};

Globe.prototype = Object.create(THREE.Object3D.prototype);
Globe.prototype.constructor = Globe;

Globe.prototype.geoToEcef = function (lat, lon, alt) {
  lat *= Math.PI/180;
  lon *= Math.PI/180;
  var a = this.equatorialRadius;
  var b = this.polarRadius;
  var e = Math.sqrt(2*this.flattening - Math.pow(this.flattening,2));
  var N = a/Math.sqrt(1-Math.pow(e,2) * Math.pow(Math.sin(lat),2));
  var x = (N + alt) * Math.cos(lat) * Math.cos(lon);
  var y = (N + alt) * Math.cos(lat) * Math.sin(lon);
  var z = (Math.pow(b,2)/Math.pow(a,2)*N+alt)*Math.sin(lat);
  return new THREE.Vector3(x,z,y);
};

Globe.prototype.getEcef = function (lat, lon, alt) {
  var ecef = this.geoToEcef(lat, lon, alt);
  return { position: {x: ecef.x, y: ecef.y, z: ecef.z}}
};

Globe.prototype.EcefToGeo = function (x, y, z) {
  var p = Math.sqrt(x * x + y * y);
  var e = Math.sqrt(2 * this.flattening - Math.pow(this.flattening, 2));
  var a = this.equatorialRadius;
  var lon = Math.atan2(y, x);
  var h = 0;
  var lat = Math.atan2(z, p*(1-Math.pow(e,2)));
  var N;
  for(var i = 0; i < 4; i++) {
    N = a/Math.sqrt(1-Math.pow(e,2)*Math.pow(Math.sin(lat),2));
    h = p / Math.cos(lat) - N;
    lat = Math.atan(z / p * (1-Math.pow(e,2)*(N/(N+h))));
  }
  if(N > 0 && N < 1e-10) N = 0;
  h = p / Math.cos(lat) - N;
  return {
    lat: lat * 180 / Math.PI,
    lon: lon * 180 / Math.PI,
    alt: h
  };
};

Globe.prototype.spark = function(params){
  params = params || {};
  var lat = params['lat'] || 0;
  var lon = params['lon'] || 0;
  var alt = params['alt'] || 10;
  var size = params['size'] || this.equatorialRadius / 10;
  var duration = params['duration'] || 1;
  var color = params['color'] || 0xffffff;
  var geo = this.geoToEcef(lat, lon, alt);
  var vertex = geo.clone();
  var idx = this.pc.numParticles;
  this.pc.geometry.vertices[idx] = vertex;
  this.pc.numParticles++;
  this.pc.visible = true;
  this.pc.geometry.verticesNeedUpdate = true;
  this.pc.material.attributes.flashSize.value[idx] = 0;
  this.pc.material.attributes.flashSize.needsUpdate = true;
  this.pc.material.attributes.cc.value[idx] = new THREE.Color(color);
  this.pc.material.attributes.cc.needsUpdate = true;
  var that = this;

  var updateSpark = function(){
    var idx = that.pc.geometry.vertices.indexOf(vertex);
    that.pc.material.attributes.flashSize.value[idx] = this.size;
    that.pc.material.attributes.flashSize.needsUpdate = true;
  };

  var killSpark = function(){
    var idx = that.pc.geometry.vertices.indexOf(vertex);
    that.pc.geometry.vertices[idx] = new THREE.Vector3();
    that.pc.numParticles--;
    if (that.pc.numParticles = 0) { that.pc.visible = false; }
    that.pc.geometry.verticesNeedUpdate = true;
    that.pc.material.attributes.flashSize.value[idx] = 0;
    that.pc.material.attributes.flashSize.needsUpdate = true;
    that.pc.material.attributes.cc.value[idx] = new THREE.Color();
    that.pc.material.attributes.cc.needsUpdate = true;
  };

  new TWEEN.Tween({size: 0})
      .to({size: size}, 125)
      .easing(TWEEN.Easing.Exponential.In)
      .onUpdate(updateSpark)
      .chain(new TWEEN.Tween({size: size})
          .to({size: 0}, 1000 * duration - 125)
          .easing(TWEEN.Easing.Exponential.Out)
          .onUpdate(updateSpark)
          .onComplete(killSpark))
      .start();
};

Globe.prototype.drawEdge = function(source, target, color, fade, width) {
  fade = fade || false;
  var multiplier = params.fountainHeight;

  //cache the coordinates of the source and target nodes
  var sourceXy = source.position;
  var targetXy = target.position;

  //get averages (mid-point) between coordinates of source and target
  var AvgX = (sourceXy.x + targetXy.x)/2;
  var AvgY = (sourceXy.y + targetXy.y)/2;
  var AvgZ = (sourceXy.z + targetXy.z)/2;

  var middle = [ AvgX * multiplier, AvgY * multiplier, AvgZ * multiplier ];

  //make quadratic bezier out of the three points
  var curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(sourceXy.x, sourceXy.y, sourceXy.z), new THREE.Vector3(middle[0], middle[1], middle[2]), new THREE.Vector3(targetXy.x, targetXy.y, targetXy.z));

  /////////// sets number of lines in curve and corresponds to number of particles //////////////

  var points = curve.getPoints(params.particleFrequency);

  /////////// this function takes in a set of points and returns a geometry ////////////////
  THREE.Curve.Utils.createLineGeometry = function( points ) {
  	var geometry = new THREE.Geometry();
  	for( var i = 0; i < points.length; i ++ ) {
  		geometry.vertices.push( points[i] );
  	}
  	return geometry;
  };

  /////////// creates a curve geometry from points on the bezier curve formed above /////////////
  var curveGeometry = THREE.Curve.Utils.createLineGeometry( points );

  /////////// constrains a value v to be between a min and max value ///////////////////
  function constrain(v, min, max){
  	if( v < min )
  		v = min;
  	else
  	if( v > max )
  		v = max;
  	return v;
  }

  /////////// creates what will be the fancy edges ////////////////
  var linesGeo = new THREE.Geometry();
	linesGeo.merge(curveGeometry);

  /////////// creates what will be the particles along the fancy edges /////////////
  var particlesGeo = new THREE.Geometry();
	var particleColors = [];

	var particleColor = new THREE.Color(0xdd380c);

  var points = curveGeometry.vertices;

  var particleCount = 100;  //  <- This determines how heavy the sprites show up.  Higher number -> Denser image

  var particleSize = params.particleSize; // curveGeometry.size;

  /////////// updates particle position relative to other particles in particle animation //////////////
  ///// i.e., particle in front goes to the back of the line when it gets to the end of the curve //////
	for( var s=0; s<particleCount; s++ ){
		var desiredIndex = s / particleCount * points.length;
		var rIndex = constrain(Math.floor(desiredIndex),0,points.length-1);
		var point = points[rIndex];
		var particle = point.clone();
		particle.moveIndex = rIndex;
		particle.nextIndex = rIndex+1;
		if(particle.nextIndex >= points.length )
			particle.nextIndex = 0;
		particle.lerpN = 0;
		particle.path = points;
		particlesGeo.vertices.push( particle );
		particle.size = particleSize;
		particleColors.push( particleColor );
	}

  ////////////////////////// fancy edge coloring and formatting //////////////////////
  linesGeo.colors = new THREE.Color(0xdd380c);
  //create curved line and add to scene
  var curvedLine = new THREE.Line( linesGeo, new THREE.LineBasicMaterial({ // these are the skinny lines
		                              	               color: 0xdd380c,
                                                   opacity: 0.3,
                                                   blending: THREE.NormalBlending,
                                                   transparent:true, // no discernable effect
			                                             depthWrite: true,
                                                   vertexColors: true,
			                                             linewidth: 10 })
	                     );

	curvedLine.renderDepth = false;


  ///////////////////  This is what actually shades and textures the particle edges  ///////////////////////
	var shaderMaterial = new THREE.ShaderMaterial( {

		uniforms: 		{
      amplitude: { type: "f", value: 1.0 },
      color:     { type: "c", value: new THREE.Color( 0xffffff ) },  // these are the clouds
      texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "../assets/images/particleA.png" ) }
    },
		attributes:     {
      size: {	type: 'f', value: [] },
      customColor: { type: 'c', value: [] }
    },
		vertexShader:   [
      'uniform float amplitude;',
      'attribute float size;',
      'attribute vec3 customColor;',
      'varying vec3 vColor;',
      'void main() {',
        'vColor = customColor;',
        'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
        'gl_PointSize = size * 300.0 / length(mvPosition.xyz);',
        'gl_Position = projectionMatrix * mvPosition;',
      '}'
    ].join('\n'),
		fragmentShader: [
      'uniform vec3 color;',
      'uniform sampler2D texture;',
      'varying vec3 vColor;',
      'void main() {',
        'gl_FragColor = vec4( color * vColor, 1.0 );',
        'gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );',
      '}'
    ].join('\n'),
		blending: 		THREE.AdditiveBlending,
		depthTest: 		true,
		depthWrite: 	false, // <- if true, does not blend sprites
		transparent:	true // <- if true, does not blend sprites
		// sizeAttenuation: true,
	});

  /////////////////////  Format the particle colors and add particles to line  ////////////////////////
	particlesGeo.colors = particleColor; // particleColors;
	var pSystem = new THREE.PointCloud( particlesGeo, shaderMaterial );
	pSystem.dynamic = true;
	curvedLine.add( pSystem );

	var vertices = pSystem.geometry.vertices;
	var values_size = shaderMaterial.attributes.size.value;
	var values_color = shaderMaterial.attributes.customColor.value;

  ///////////////////////// store vertices and vertex colors /////////////////////////
	for( var v = 0; v < vertices.length; v++ ) {
		values_size[ v ] = pSystem.geometry.vertices[v].size;
		values_color[ v ] = new THREE.Color(0xdd380c)// particleColors[v];
	}

  shaderMaterial.attributes.size.needsUpdate = true;
  shaderMaterial.attributes.customColor.needsUpdate = true;

  /////////////////// this function actually updates the particles absolute position //////////////////
	pSystem.update = function(){
		// var time = Date.now()
		for( var i in this.geometry.vertices ){
			var particle = this.geometry.vertices[i];
			var path = particle.path;
			var moveLength = path.length;

			particle.lerpN += 0.025;
			if(particle.lerpN > 1){
				particle.lerpN = 0;
				particle.moveIndex = particle.nextIndex;
				particle.nextIndex++;
				if( particle.nextIndex >= path.length ){
					particle.moveIndex = 0;
					particle.nextIndex = 1;
				}
			}

			var currentPoint = path[particle.moveIndex];
			var nextPoint = path[particle.nextIndex];


			particle.copy( currentPoint );
			particle.lerp( nextPoint, particle.lerpN );
		}
		this.geometry.verticesNeedUpdate = true;
	};

  /////////////////  get ride of the edge ///////////////////////
  var onComplete = function(curvedLine){
    scene.remove(curvedLine);
  };

  /////////////////// add the edge to the scene ////////////////////
  scene.add(curvedLine);

  //////////////////// fade out the edge //////////////////////////
  if(fade){
    curvedLine.material.transparent = true;
    new TWEEN.Tween(curvedLine.material)
        .to({opacity: 0}, 1000)
        .onComplete(function(){
          scene.remove(curvedLine);
        })
        .start();
    //createjs.Tween.get(curvedLine.material).wait(1000).to({opacity: 0}, 1000).call(onComplete, [curvedLine]);
  }
};


Globe.prototype.dateToJD = function(date){
  var y = date.getUTCFullYear();
  var m = date.getUTCMonth() + 1;
  var d = date.getUTCDate();
  d += date.getUTCHours() / 24;
  d += date.getUTCMinutes() / (60 * 24);
  d += date.getUTCSeconds() / (60 * 60 * 24);
  d += date.getUTCMilliseconds() / (1000 * 60 * 60 * 24);
  if (m < 3) { y--; m+=12; }
  var a = Math.floor(y/100);
  var b = 2-a+Math.floor(a/4);
  return Math.floor(365.25  * (y + 4716)) +
         Math.floor(30.6001 * (m + 1   )) +
         d + b - 1524.5;
};


Globe.prototype.solarCoordinates = function(date){
  var JD = this.dateToJD(date);
  var T = (JD - 2451545.0)/36525.0;
  var L0 = 280.46646 +
           36000.76983 * T +
           0.0003032 * Math.pow(T, 2);
  var M = 357.52911 +
          35999.05029 * T +
          0.0001537 * Math.pow(T, 2);
  var e = 0.016708634 -
          0.000042037 * T -
          0.0000001267 * Math.pow(T, 2);
  var C = (1.914602 - 0.004817 * T - 0.000014 * Math.pow(T, 2)) * Math.sin(THREE.Math.degToRad(M)) +
          (0.019993 - 0.000101 * T) * Math.sin(THREE.Math.degToRad(2 * M)) +
          0.000289 * Math.sin(THREE.Math.degToRad(3 * M));
  var lon = L0 + C;
  var v = M + C;
  var R = 1.000001018 * (1 - Math.pow(e, 2)) / (1 + e * Math.cos( THREE.Math.degToRad(v) ));
  var Ω = 125.04 - 1934.136 * T;
  var ε0 = 23 + (26/60) + (21.448/3600) - ((46.8150/3600) * T) - ((0.00059/3600) * Math.pow(T, 2)) + ((0.001813/3600) * Math.pow(T, 3));
  var ε = ε0 + 0.00256 * Math.cos(THREE.Math.degToRad(Ω));
  var λ = lon - 0.00569 - 0.00478 * Math.sin(THREE.Math.degToRad(Ω));
  var α = THREE.Math.radToDeg(Math.atan2(Math.cos(THREE.Math.degToRad(ε)) * Math.sin(THREE.Math.degToRad(λ)), Math.cos(THREE.Math.degToRad(λ))));
  var δ = THREE.Math.radToDeg(Math.asin(Math.sin(THREE.Math.degToRad(ε)) * Math.sin(THREE.Math.degToRad(λ))));
  return {
    T: T,
    L0: L0 % 360 + (L0 < 0 ? 360 : 0),
    M: M % 360 + (L0 < 0 ? 360 : 0),
    e: e,
    C: C,
    lon: lon % 360 + (lon < 0 ? 360 : 0),
    R: R,// * 23454.791 / this.equatorialRadius,
    Ω: Ω % 360 + (Ω < 0 ? 360 : 0),
    λ: λ % 360 + (λ < 0 ? 360 : 0),
    ε0: ((ε0 + 180) % 360) - 180,
    ε: ((ε + 180) % 360) - 180,
    α: α % 360 + (α < 0 ? 360 : 0),
    δ: ((δ + 180) % 360) - 180
  }
};

Globe.prototype.siderealTime = function(date){
  var JD = this.dateToJD(date);
  var T = (JD - 2451545.0) / 36525.0;
  var θ = (280.46061837 +
           360.98564736629 * (JD - 2451545.0) +
           0.000387933 * Math.pow(T, 2) -
           Math.pow(T, 3) / 38710000) % 360;
  if (θ < 0) { θ += 360; }
  return θ;
};
