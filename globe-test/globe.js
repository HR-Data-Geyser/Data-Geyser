var Globe = function(r){
  THREE.Object3D.call(this);
  var geo = new THREE.SphereGeometry(r, 72, 36);
  geo.applyMatrix(new THREE.Matrix4().scale(new THREE.Vector3(1.0, 1.0-(1.0/298.257223563), 1.0)));
  var bmng = THREE.ImageUtils.loadTexture('earth/bmng.png');
  var spec = THREE.ImageUtils.loadTexture('earth/spec.png');
  var norm = THREE.ImageUtils.loadTexture('earth/norm.png');
  var mat = new THREE.MeshPhongMaterial({
    shininess: 50,
    map: bmng,
    normalMap: norm,
    specularMap: spec
  });
  var mesh = new THREE.Mesh(geo, mat);
  this.add(mesh);
};

Globe.prototype = Object.create(THREE.Object3D.prototype);
Globe.prototype.constructor = Globe;
