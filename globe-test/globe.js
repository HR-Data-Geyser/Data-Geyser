var SparkShader = {
  uniforms: {
    color: {type: 'c', value: new THREE.Color(0xffffff)},
    texture: {type: 't', value: new THREE.Texture()}
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
};

AtmosphereShader = {
  uniforms:{
    planet_radius: {type: 'v3', value: new THREE.Vector3(6378141.2, 6378141.2, 6356754.79506139)},
    sun_dir: {type: 'v3', value: new THREE.Vector3()},
    sun_col: {type: 'v3', value: new THREE.Color()},
    sun_posr: {type: 'v4', value: new THREE.Vector4()},
    B0: {type: 'v4', value: new THREE.Vector4(0.1981, 0.4656, 0.8625, 0.75)}
  },
  vertexShader: [
    'varying vec3 pixel_nor;',
    'varying vec4 pixel_pos;',
    'varying vec4 pixel_scr;',
    'uniform vec3 planet_radius;',
    'void main(void){',
    ' pixel_nor=gl_Normal;',
    ' pixel_pos=gl_Vertex;',
    ' pixel_scr=gl_Color;',
    ' gl_Position=gl_Color;',
    '}'
  ].join('\n'),
  fragmentShader: [
    '#extension GL_ARB_gpu_shader_fp64 : enable',
    'double abs(double x) { if (x < 0.0) x=-x; return x; }',
    'varying vec3 pixel_nor;',
    'varying vec4 pixel_pos;',
    'varying vec4 pixel_scr;',

    'uniform vec3 planet_radius;',
    'uniform vec3 sun_dir;',
    'uniform vec3 sun_col;',
    'uniform vec4 sun_posr;',
    'uniform vec4 B0',

    'const double view_depth_max = 100000000.0;',
    'float planet_h = planet_radius.x * 480000.0/6378141.2;',
    'float view_depth = planet_h/2;',
    'double view_depth_l0=-1.0;',
    'double view_depth_l1=-1.0;',
    'bool _view_depth_l0=false;',
    'bool _view_depth_l1=false;',

    'bool _view_depth(vec3 _p0, vec3 _dp, vec3 _r){',
    ' dvec3 p0, dp, r;',
    ' double a, b, c, d, l0, l1;',
    ' view_depth_l0=-1.0; _view_depth_l0=false;',
    ' view_depth_l1=-1.0; _view_depth_l1=false;',
    ' p0=dvec3(_p0);',
    ' dp=dvec3(_dp);',
    ' r =dvec3(_r );',
    ' a=(dp.x * dp.x * r.x) + (dp.y * dp.y * r.y) + (dp.z * dp.z * r.z);',
    ' b=(p0.x * dp.x * r.x) + (p0.y * dp.y * r.y) + (p0.z * dp.z * r.z);',
    ' b*=2.0;',
    ' c=(p0.x * p0.x * r.x) + (p0.y * p0.y * r.y) + (p0.z * p0.z * r.z) - 1.0;',
    ' d=((b*b)-(4.0*a*c));',
    ' if (d<0.0) { return false; }',
    ' d=sqrt(d);',
    ' a*=2;',
    ' l0=(-b+d)/a;',
    ' l1=(-b-d)/a;',
    ' if ((l0<0.0)||((l1<l0)&&(l1>=0.0))) { a=l0; l0=l1; l1=a; }',
    ' if (l1>=0.0) { view_depth_l1=l1; _view_depth_l1=true; }',
    ' if (l0>=0.0) { view_depth_l0=l0; _view_depth_l0=true; return true; }',
    ' return false;',
    '}',

    'bool _star_collide(vec3 _p0, vec3 _dp, float _r) {',
    ' dvec3 p0, dp, r;',
    ' double a, b, c, d, l0, l1;',
    ' p0=dvec3(_p0);',
    ' dp=dvec3(_dp);',
    ' r =dvec3(_r );',
    ' a=(dp.x * dp.x * r.x) + (dp.y * dp.y * r.y) + (dp.z * dp.z * r.z);',
    ' b=(p0.x * dp.x * r.x) + (p0.y * dp.y * r.y) + (p0.z * dp.z * r.z);',
    ' b*=2.0;',
    ' c=(p0.x * p0.x * r.x) + (p0.y * p0.y * r.y) + (p0.z * p0.z * r.z) - 1.0;',
    ' d=((b*b)-(4.0*a*c));',
    ' if (d<0.0) { return false };',
    ' d=sqrt(d);',
    ' a*=2;',
    ' l0=(-b+d)/a;',
    ' l1=(-b-d)/a;',
    ' if (abs(l0)>abs(l1)) { a=l0; l0=l1; l1=a; }',
    ' if (l0<0.0)          { a=l0; l0=l1; l1=a; }',
    ' if (l0<0.0) { return false; }',
    ' return true;',
    '}',

    'vec4 atmosphere() {',
    ' const int n=8;',
    ' const float _n=1.0/float(n);',
    ' int i;',
    ' bool b0, b1;',
    ' vec3 p0, p1, dp, p, b, a_r, p_R, a_R;',
    ' vec4 c;',
    ' float h, dl, ll;',
    ' double l0, l1, l2;',
    ' a_r.x=planet_radius.x+planet_h;',
    ' a_r.y=planet_radius.y+planet_h;',
    ' a_r.z=planet_radius.z+planet_h;',
    ' p_R.x=1.0/(planet_radius.x*planet_radius.x);',
    ' p_R.y=1.0/(planet_radius.y*planet_radius.y);',
    ' p_R.z=1.0/(planet_radius.z*planet_radius.z);',
    ' a_R.x=1.0/(a_r.x*a_r.x);',
    ' a_R.y=1.0/(a_r.y*a_r.y);',
    ' a_R.z=1.0/(a_r.z*a_r.z);',


    ' c=vec4(0.0, 0.0, 0.0, 0.0);',
    ' b1=view_depth(pixel_pos.xyz, pixel_nor, a_R);',
    ' if (!b1) { return c; }',
    ' e1=_view_depth_l0; l1=view_depth_l0;',
    ' e2=_view_depth_l1; l2=view_depth_l1;',
    ' b0=_view_depth(pixel_pos.xyz, pixel_nor, p_R);',
    ' e0=_view_depth_l0; l0=view_depth_l0;',
    ' if ((b0)&&(view_depth_l1<0.0)) return c;',
    ' dp=pixel_nor;',
    ' p0=pixel_pos.xyz;',
    ' if (!b0) {',
    '  if (!e2) {',
    '   l0=l1;',
    '  } else {',
    '   p0=vec3(dvec3(p0)+(dvec3(dp)*l1));',
    '   l0=l2-l1;',
    '  }',
    '  if (_star_collide(p0.xyz-sun.posr.xyz, dp.xyz, sun_posr.a)) {',
    '   c.rgb+=sun_col;',
    '   c.a=1.0',
    '  }',
    ' } else {',
    '  if (l1<l0) {',
    '   p0=vec3(dvec3(p0)+(dvec3(dp)*l1));',
    '   l0=l0-l1;',
    '  }',
    ' }',
    ' p1=vec3(dvec(p0)+(dvec(dp)*l0));',
    ' dp=p1-p0;',
    ' dp*=_n;',
    ' dl=float(l0)*_n/view_depth;',
    ' ll=B0.a;',
    ' ll+=dot(normalize(p1), sun_dir);',
    ' for (p=p1, i=0; i<n; p-=dp, i++) {',
    '  b=normalize(p).planet_radius;',
    '  h=length(p-b);',
    '  h=exp(h/planet_h)/2.78;',
    '  b=B0.rgb*h*dl;',
    '  c.r*=1.0-b.r;',
    '  c.g*=1.0-b.g;',
    '  c.b*=1.0-b.b;',
    '  c.rgb+=b*ll;',
    ' }',
    ' if (c.r<0.0) { c.r=0.0; }',
    ' if (c.g<0.0) { c.g=0.0; }',
    ' if (c.b<0.0) { c.b=0.0; }',
    ' h=0.0;',
    ' if (h<c.r) { h=c.r; }',
    ' if (h<c.g) { h=c.g; }',
    ' if (h<c.b) { h=c.b; }',
    ' if (h>1.0) {',
    '  h=1.0/h;',
    '  c.r*=h;',
    '  c.g*=h;',
    '  c.b*=h;',
    ' }',
    ' return c;',
    '}',

    'void main(void) {',
    ' gl_FragColor.rgba=atmosphere();',
    '}'
  ].join('\n')
};

var Globe = function (r) {
  THREE.Object3D.call(this);
  this.flattening = 1.0 / 298.257223563;
  this.equatorialRadius = r;
  this.polarRadius = this.equatorialRadius * (1.0 - this.flattening);

  var loader = new THREE.LoadingManager(function(){
    document.getElementById('loader-parent').style.display = 'none';
  }, function(url, done, total){
    var text = '';
    for (var i = 0; i < total; i++){
      if (i < done){text += '◉';}
      else {text += '◎';}
    }
    text += '\nLoading...';
    document.getElementById('loader-child').innerText = text;
  });



  // lights
  //var sunLight = new THREE.DirectionalLight(0xffffff, 1.0);


  // geometry
  var globeGeometry = new THREE.SphereGeometry(r, 72, 36);
  //var atmosphereGeometry = THREE.SphereGeometry(r, 72, 36);
  var skyboxGeometry = new THREE.SphereGeometry(5000, 72, 36);
  var sparkGeometry = new THREE.Geometry();
  //var sunGeometry = new THREE.Geometry();
  globeGeometry.applyMatrix(new THREE.Matrix4().scale(new THREE.Vector3(1.0, 1.0, 1.0 - this.flattening)));
  //atmosphereGeometry.applyMatrix(new THREE.Matrix4().scale(new THREE.Vector3(480000.0/6378141.2, 480000.0/6378141.2, 480000.0/6378141.2)));
  //sunGeometry.vertices.push(sunLight.position);

  // materials
  var globeMaterial = new THREE.MeshPhongMaterial({shininess  : 50, color: 'black'});
  var skyboxMaterial = new THREE.MeshBasicMaterial({side: THREE.BackSide, color: 'black'});
  var sparkMaterial = new THREE.ShaderMaterial(SparkShader);
  //var atmosphereMaterial = new THREE.ShaderMaterial(AtmosphereShader);
  //var sunMaterial = new THREE.PointCloudMaterial(???);
  //atmosphereMaterial.uniforms.planet_radius.value.set(this.equatorialRadius, this.equatorialRadius, this.polarRadius);
  //atmosphereMaterial.uniforms.sun_dir.value = sunLight.position;
  //atmosphereMaterial.uniforms.sun_col.value = sunLight.color;
  //atmosphereMaterial.uniforms.sun_posr.value = ???

  // meshes
  var globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
  var skyboxMesh = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
  //var atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  var sparkMesh = new THREE.PointCloud(sparkGeometry, sparkMaterial);
  sparkMesh.sortParticles = true;
  sparkMesh.dynamic = true;
  sparkMesh.numParticles = 0;
  sparkMesh.visible = false;
  // sunmesh







  var geographic = new THREE.Object3D();
  geographic.add(globeMesh);
  geographic.add(sparkMesh);
  //geographic.add(atmosphereMesh);









  this.add(geographic);
  //this.add(globeMesh);
  //this.add(sparkMesh);
  this.add(skyboxMesh);



  // texture loader
  var textureLoader = new THREE.TextureLoader(loader);
  textureLoader.load('earth/bmng.png', function(texture){
    texture.anisotropy = 2;
    globeMaterial.map = texture;
    globeMaterial.color = new THREE.Color();
    globeMaterial.needsUpdate = true;
    console.log('globeTexture loaded');
  });
  textureLoader.load('earth/spec.png', function(texture){
    texture.anisotropy = 2;
    globeMaterial.specularMap = texture;
    globeMaterial.needsUpdate = true;
    console.log('globeSpecular loaded');
  });
  textureLoader.load('earth/norm.png', function(texture){
    texture.anisotropy = 2;
    globeMaterial.normalMap = texture;
    globeMaterial.needsUpdate = true;
    console.log('globeNormal loaded');
  });
  textureLoader.load('tycho3.png', function(texture){
    texture.anisotropy = 2;
    skyboxMaterial.map = texture;
    skyboxMaterial.color = new THREE.Color();
    skyboxMaterial.needsUpdate = true;
    console.log('skyboxTexture loaded');
  });
  textureLoader.load('spark.png', function(texture){
    texture.anisotropy = 2;
    sparkMaterial.map = texture;
    sparkMaterial.needsUpdate = true;
    sparkMaterial.uniforms.texture.value = texture;
    sparkMaterial.uniforms.texture.needsUpdate;
    console.log('sparkTexture loaded');
  });

  // prepopulate the point cloud
  for (var i = 0; i < 10000; i++){
    sparkGeometry.vertices.push(new THREE.Vector3());
    sparkMaterial.attributes.cc.value.push(new THREE.Color());
    sparkMaterial.attributes.flashSize.value.push(0);
  }


  // class methods
  this.update = function(delta){
    geographic.rotation.y += 0.01 * delta;
  };

  this.spark = function(params){
    params = params || {};
    var lat = params['lat'] || 0;
    var lon = params['lon'] || 0;
    var alt = params['alt'] || 10;
    var size = params['size'] || this.equatorialRadius / 10;
    var duration = params['duration'] || 1;
    var color = params['color'] || 0xffffff;
    var geo = this.geoToEcef(lat, lon, alt);
    var vertex = geo.clone();
    var idx = sparkMesh.numParticles;
    sparkGeometry.vertices[idx] = vertex;
    sparkMesh.numParticles++;
    sparkMesh.visible = true;
    sparkGeometry.verticesNeedUpdate = true;
    sparkMaterial.attributes.flashSize.value[idx] = 0;
    sparkMaterial.attributes.flashSize.needsUpdate = true;
    sparkMaterial.attributes.cc.value[idx] = new THREE.Color(color);
    sparkMaterial.attributes.cc.needsUpdate = true;
    var updateSpark = function(){
      var idx = sparkGeometry.vertices.indexOf(vertex);
      sparkMaterial.attributes.flashSize.value[idx] = this.size;
      sparkMaterial.attributes.flashSize.needsUpdate = true;
    };
    var killSpark = function(){
      var idx = sparkGeometry.vertices.indexOf(vertex);
      sparkGeometry.vertices[idx] = new THREE.Vector3();
      sparkMesh.numParticles--;
      if (sparkMesh.numParticles = 0) { sparkMesh.visible = false; }
      sparkGeometry.verticesNeedUpdate = true;
      sparkMaterial.attributes.flashSize.value[idx] = 0;
      sparkMaterial.attributes.flashSize.needsUpdate = true;
      sparkMaterial.attributes.cc.value[idx] = new THREE.Color();
      sparkMaterial.attributes.cc.needsUpdate = true;
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


Globe.prototype.dateToJD = function(date){
  var y = date.getUTCFullYear();
  var m = date.getUTCMonth() + 1;
  var d = date.getUTCDate();
  d += date.getUTCHours / 24;
  d += date.getUTCMinutes / (60 * 24);
  d += date.getUTCSeconds / (60 * 60 * 24);
  d += date.getUTCMilliseconds / (1000 * 60 * 60 * 24);
  if (m < 3) { y--; m+=12; }
  var a = Math.floor(y/100);
  var b = 2-a+Math.floor(a/4);
  return Math.floor(365.25  * (y + 4716)) +
         Math.floor(30.6001 * (m + 1   )) +
         d + b - 1524.5;
};


Globe.prototype.solarCoordinates = function(date){
  var jd = this.dateToJD(date);
  var t = (jd - 2451545.0)/36525.0;
  //var l0 =
};