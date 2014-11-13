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
  var tweet = {};
  lat *= Math.PI/180;
  lon *= Math.PI/180;
  var a = this.equatorialRadius;
  var b = this.polarRadius;
  var e = Math.sqrt(2*this.flattening - Math.pow(this.flattening,2));
  var N = a/Math.sqrt(1-Math.pow(e,2) * Math.pow(Math.sin(lat),2));
  var x = (N + alt) * Math.cos(lat) * Math.cos(lon);
  var y = (N + alt) * Math.cos(lat) * Math.sin(lon);
  var z = (Math.pow(b,2)/Math.pow(a,2)*N+alt)*Math.sin(lat);
  tweet.position = {x: x, y: y, z: z};
  return tweet;
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

Globe.prototype.flash = function(params){
  var lat = params['lat'] || 0;
  var lon = params['lon'] || 0;
  var alt = params['alt'] || 0;
  var size = params['size'] || 1;
  var duration = params['duration'] || 1;
  var geo = this.geoToEcef(lat, lon, alt);
  var arrow = new THREE.ArrowHelper(geo.clone().normalize(), geo.clone(), 0, new THREE.Color(params.color), undefined, 0)
  this.add(arrow);
  var that = this;
  var updateArrow = function(){
    arrow.setLength(this.length, undefined, this.headWidth);
  };
  var outTween = new TWEEN.Tween({length: size, headWidth: size})
      .to({length: 0, headWidth: size * 7 / 8}, 875 * duration)
      .easing(TWEEN.Easing.Exponential.In)
      .onUpdate(updateArrow)
      .onComplete(function(){
        that.remove(arrow);
      });
  var inTween = new TWEEN.Tween({length: 0, headWidth: 0})
      .to({length: size, headWidth: size}, 125 * duration)
      .easing(TWEEN.Easing.Circular.Out)
      .onUpdate(updateArrow)
      .chain(outTween)
      .start();
};

Globe.prototype.drawEdge = function(source, target, color, fade, width) {
  fade = fade || false;
  //var distance = latlonDistance(source.position, target.position);
  var multiplier = 1.5;

  //make a 3js line object
  var material = new THREE.LineBasicMaterial( { color: 0xCCCCCC, opacity: 0.5, linewidth: width } );

  //cache the coordinates of the source and target nodes
  var sourceXy = source.position;
  var targetXy = target.position;

  //get averages (mid-point) between coordinates of source and target
  var AvgX = (sourceXy.x + targetXy.x)/2;
  var AvgY = (sourceXy.y + targetXy.y)/2;
  var AvgZ = (sourceXy.z + targetXy.z)/2;
  //get difference between source and target
  var diffX = Math.abs(sourceXy.x - targetXy.x);
  var diffY = Math.abs(sourceXy.y - targetXy.y);
  //set middle point to average(x/y) and average(z + sum of difference(x/y))
  var middle = [ AvgX * multiplier, AvgY * multiplier, AvgZ * multiplier ];

  //make quadratic bezier out of the three points
  var curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(sourceXy.x, sourceXy.y, sourceXy.z), new THREE.Vector3(middle[0], middle[1], middle[2]), new THREE.Vector3(targetXy.x, targetXy.y, targetXy.z));

  //make a curve path and add the bezier curve to it
  var path = new THREE.CurvePath();
  path.add(curve);

  //create material for our line
  var curveMaterial = new THREE.LineBasicMaterial({
    color: color, linewidth: 2, transparent: true
  });

  //create curved line and add to scene
  var curvedLine = new THREE.Line(path.createPointsGeometry(100), curveMaterial);
  curvedLine.lookAt(scene.position);
  var onComplete = function(curvedLine){
    scene.remove(curvedLine);
  };
  scene.add(curvedLine);
  if(fade){
    // curvedLine.material.transparent = true;
    // createjs.Tween.get(curvedLine.material).wait(5000).to({opacity: 0}, 5000).call(onComplete, [curvedLine]);
    setTimeout(function(){
      onComplete(curvedLine);
    }, 1000);
  }
}