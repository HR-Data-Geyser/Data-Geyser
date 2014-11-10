/**
 * Created by tom on 11/6/14.
 */


var render = function(){
  //scene.updateMatrixWorld();
  //scene.traverse(function(obj){
  //  if (obj instanceof THREE.LOD){
  //    obj.update(camera);
  //  }
  //});
  renderer.render(scene, camera);
};

var animate = function(){
  requestAnimationFrame(animate);
  camera.lookAt(globe.position);
  globe.rotation.y += 0.001;
  var text = 'Camera distance: ';
  text += (Math.round(1000 * camera.position.distanceTo(globe.position)) / 1000).toString();
  //text += '\nLOD: ';
  //for (var i = 0; i < globe.children[0].objects.length; i++){
  //  if (globe.children[0].objects[i].object.visible){
  //    text += (globe.children[0].objects.length - i).toString() + ' ' + globe.children[0].objects[i].distance;
  //    break;
  //  }
  //}
  document.getElementById('info').innerText = text;
  render();
};

var globe = new Globe(1000, true);
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 5, 100000);
var renderer = new THREE.WebGLRenderer({precision: 'highp', preserveDrawingBuffer: true});
var controls = new THREE.OrbitControls(camera);
var light = new THREE.DirectionalLight(0xffffff, 1);
scene.add(new THREE.AmbientLight(0x202020));
light.position.set(5000, 0, 0);
camera.lookAt(scene.position);
camera.position.set(0.0, 0.0, 4000);
renderer.setSize(window.innerWidth, window.innerHeight);
globe.position.set(0.0, 0.0, 0.0);
scene.add(globe);
scene.add(light);
document.body.appendChild(renderer.domElement);
controls.addEventListener('change', render);
render();
animate();