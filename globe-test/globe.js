var Globe = function(r){
  THREE.Object3D.call(this);
  this.flattening = 1.0 / 298.257223563;
  this.equatorialRadius = r;
  this.polarRadius = this.equatorialRadius * (1.0 - this.flattening);

  var geo = new THREE.SphereGeometry(r, 72, 36);
  geo.applyMatrix(new THREE.Matrix4().scale(new THREE.Vector3(1.0, 1.0 - this.flattening, 1.0)));

  this.add(new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1.5 * r, 0x00ff00));

  for (var i = 0; i < geo.vertices.length; i++){
    var vertex = geo.vertices[i];
    if (vertex.)
  }


  var bmng = THREE.ImageUtils.loadTexture('earth/bmng.png');
  bmng.wrapS = bmng.wrapT = THREE.MirroredRepeatWrapping;
  var spec = THREE.ImageUtils.loadTexture('earth/spec.png');
  spec.wrapS = spec.wrapT = THREE.MirroredRepeatWrapping;
  var norm = THREE.ImageUtils.loadTexture('earth/norm.png');
  norm.wrapS = norm.wrapT = THREE.MirroredRepeatWrapping;
  var mat = new THREE.MeshPhongMaterial({
    shininess: 50,
    map: bmng,
    normalMap: norm,
    specularMap: spec
  });

  // testing wireframe
  mat = new THREE.MeshBasicMaterial({color: 'red', wireframe: true});

  var mesh = new THREE.Mesh(geo, mat);
  this.add(mesh);
};

Globe.prototype = Object.create(THREE.Object3D.prototype);
Globe.prototype.constructor = Globe;


Globe.prototype.geoToRect = function(lat, lon){

}