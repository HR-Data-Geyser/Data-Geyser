
var Globe = function(r){

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
