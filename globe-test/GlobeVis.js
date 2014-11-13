THREE.GlobeVis = function(){
  THREE.Object3D.call(this);
  // geographic scale is kilometers
  var bodies = {
    earth: {
      a: 6378.1370,
      b: 6356.7523,
      f: 1.0 / 298.25722
    },
    moon: {
      a: 1738.14,
      b: 1735.97,
      f: 1.0 / 800
    }
  };

  var skybox_geo = new THREE.SphereGeometry(150000000, 36, 18);
  var skybox_tex = THREE.ImageUtils.loadTexture('sky/tycho.png');
  var skybox_mat = new THREE.MeshLambertMaterial({map: skybox_tex});
  skybox_mat.side = THREE.BackSide;
  var skybox = new THREE.Mesh(skybox_geo, skybox_mat);
  skybox.position.set(0,0,0);
  this.add(skybox);



  var globe = new THREE.LOD();
  var sun = new THREE.DirectionalLight();
  var moon = new THREE.LOD();





};

THREE.GlobeVis.prototype = Object.create(THREE.Object3D.prototype);
THREE.GlobeVis.prototype.constructor = THREE.GlobeVis;


