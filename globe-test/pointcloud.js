var renderer, scene, camera, stats;
var sphere, uniforms, attributes;
var noise = [];
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var init = function(){
  camera = new THREE.PerspectiveCamera(40, WIDTH/HEIGHT, 1, 10000);
  camera.position.z = 300;
  scene = new THREE.Scene();
  attributes = {
    size: {type: 'f', value: []},
    customColor: {type: 'c', value: []}
  };
  uniforms = {
    amplitude: {type: 'f', value: 1.0},
    color: {type: 'c', value: new THREE.Color(0xffffff)},
    texture: {type: 't', value: THREE.ImageUtils.loadTexture('spark.png')}
  };
  var shaderMaterial = new THREE.ShaderMaterial({
    uniforms: uniforms,
    attributes: attributes,
    vertexShader: [
      'uniform float amplitude;',
      'attribute float size;',
      'attribute vec3 customColor;',
      'varying vec3 vColor;',
      'void main() {',
      ' vColor = customColor;',
      ' vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
      ' gl_PointSize = size * (300.0 / length(mvPosition.xyz));',
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
    depthTest: false,
    transparent: true
  });
  var radius = 200;
  var geometry = new THREE.Geometry();
  for (var i = 0; i < 100000; i++){
    var vertex = new THREE.Vector3();
    vertex.x = Math.random() * 2 - 1;
    vertex.y = Math.random() * 2 - 1;
    vertex.z = Math.random() * 2 - 1;
    vertex.multiplyScalar(radius);
    geometry.vertices.push(vertex);
  }
  sphere = new THREE.PointCloud(geometry, shaderMaterial);
  sphere.dynamic = true;
  var vertices = sphere.geometry.vertices;
  var values_size = attributes.size.value;
  var values_color = attributes.customColor.value;
  for (var v = 0; v < vertices.length; v++){
    values_size[v] = 10;
    values_color[v] = new THREE.Color(0xffaa00);
    if (vertices[v].x < 0){
      values_color[v].setHSL(0.5 + 0.1 * (v/vertices.length), 0.7, 0.5);
    } else {
      values_color[v].setHSL(0.0 + 0.1 * (v/vertices.length), 0.9, 0.5);
    }
  }
  scene.add(sphere);
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(WIDTH, HEIGHT);
  var container = document.getElementById('container');
  container.appendChild(renderer.domElement);
  window.addEventListener('resize', onWindowResize, false);
};

var onWindowResize = function(){
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth / window.innerHeight);
};

var animate = function(){
  requestAnimationFrame(animate);
  var time = Date.now() * 0.005;
  sphere.rotation.z = 0.1 * time;
  for (var i = 0; i < attributes.size.value.length; i++){
    attributes.size.value[i] = 14 + 13 * Math.sin(0.1 * i + time);
  }
  attributes.size.needsUpdate = true;
  render();
};

var render = function(){
  renderer.render(scene, camera);
};

init();
animate();