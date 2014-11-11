var Globe = function (r) {
  THREE.Object3D.call(this);
  this.flattening = 1.0 / 298.257223563;
  this.equatorialRadius = r;
  this.polarRadius = this.equatorialRadius * (1.0 - this.flattening);

  var geo = new THREE.SphereGeometry(r, 72, 36);
  geo.applyMatrix(new THREE.Matrix4().scale(new THREE.Vector3(1.0, 1.0 - this.flattening, 1.0)));


  var bmng = THREE.ImageUtils.loadTexture('earth/bmng.png');
  bmng.wrapS = bmng.wrapT = THREE.RepeatWrapping;
  var spec = THREE.ImageUtils.loadTexture('earth/spec.png');
  spec.wrapS = spec.wrapT = THREE.RepeatWrapping;
  var norm = THREE.ImageUtils.loadTexture('earth/norm.png');
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
  var cle = this.geoToEcef(41.4822, 81.6697, 0);
  var sf = this.geoToEcef(37.7833, 122.4167, 0);
  var gib = this.geoToEcef(35.9717, 5.4858, 0);
  var evr = this.geoToEcef(27 + (59 + 17/60)/60, -86 + (55 + 31/60)/60, 8848/6378137 * 1000)
  //this.add(new THREE.ArrowHelper(cle.clone().normalize(), cle.clone(), 0.5 * r, 0x00ff00));
  //this.add(new THREE.ArrowHelper(sf.clone().normalize(), sf.clone(), 0.5 * r, 0x0000ff));
  //this.add(new THREE.ArrowHelper(gib.clone().normalize(), gib.clone(), 0.5 * r, 0xff0000));
  //this.add(new THREE.ArrowHelper(evr.clone().normalize(), evr.clone(), 0.5 * r, 0xffff00));
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
  var arrow = new THREE.ArrowHelper(geo.clone().normalize(), geo.clone(), 0, new THREE.Color('orange'), undefined, 0)
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