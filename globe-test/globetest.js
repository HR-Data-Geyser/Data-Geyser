/**
 * Created by tom on 11/6/14.
 */
var clock = new THREE.Clock();
var clock2 = new THREE.Clock(true);
var useComposer = true;


var render = function(){
  //scene.updateMatrixWorld();
  //scene.traverse(function(obj){
  //  if (obj instanceof THREE.LOD){
  //    obj.update(camera);
  //  }
  //});
  renderer.clear();
  if (useComposer){
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
};
var firstTimestamp = parseInt(Ebola[0]['timestamp_ms'])/1000;
var animate = function(){
  requestAnimationFrame(animate);
  camera.lookAt(globe.position);
  //globe.rotation.y += 0.1 * clock2.getDelta();
  globe.update(clock2.getDelta());
  TWEEN.update();
  if (clock.running){
    while(Ebola[0] && (parseInt(Ebola[0]['timestamp_ms'])/1000 - firstTimestamp < clock.getElapsedTime() * 1000)){
      var tweet = Ebola.splice(0,1)[0];
      console.log(Math.log(tweet['user']['followers_count']), 'seconds');
      globe.spark({
        lat     : tweet['coordinates']['coordinates'][1],
        lon     : -tweet['coordinates']['coordinates'][0],
        color   : tweet['retweeted_status'] ? 0xFF00000 : (tweet['in_reply_to_status_id'] ? 0x00FF00 : 0x0000FF),
        size    : 200 + Math.log(Math.pow(tweet['user']['followers_count'], 3)),
        duration: Math.max(0.25, Math.log(tweet['user']['followers_count']))
      });
    }
    var text = Ebola.length + ' tweets remaining';
    document.getElementById('info').innerText = text;
  } else {
    document.getElementById('info').innerText = '';
  }
  //for (var i = 0; i < globe.pc.material.attributes.size.value.length; i++){
  //  globe.pc.material.attributes.size.value[i] = 14 + 13 * Math.sin(0.1 * i + time);
  //}
  //globe.pc.material.attributes.size.needsUpdate = true;
  //var text = 'Camera distance: ';
  //text += (Math.round(1000 * camera.position.distanceTo(globe.position)) / 1000).toString();
  //text += '\nLOD: ';
  //for (var i = 0; i < globe.children[0].objects.length; i++){
  //  if (globe.children[0].objects[i].object.visible){
  //    text += (globe.children[0].objects.length - i).toString() + ' ' + globe.children[0].objects[i].distance;
  //    break;
  //  }
  //}
  //document.getElementById('info').innerText = text;
  render();
};

var globe = new Globe(1000);
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 5, 100000000);
var renderer = new THREE.WebGLRenderer({precision: 'highp', preserveDrawingBuffer: true});
var composer = new THREE.EffectComposer(renderer);
var renderPass = new THREE.RenderPass(scene, camera);
var bloomPass = new THREE.BloomPass(1.0);
var fxaaPass = new THREE.ShaderPass(THREE.FXAAShader);
var bleachPass = new THREE.ShaderPass(THREE.BleachBypassShader);
var filmPass = new THREE.ShaderPass(THREE.FilmShader);
var luminosityPass = new THREE.ShaderPass(THREE.LuminosityShader);
var copyPass = new THREE.ShaderPass(THREE.CopyShader);
var controls = new THREE.OrbitControls(camera);
var light = new THREE.DirectionalLight(0xffffff, 1.25);
var oculus = new THREE.OculusRiftEffect(renderer);
var textureFlare0 = THREE.ImageUtils.loadTexture('flare/lensflare0.png');
var textureFlare1 = THREE.ImageUtils.loadTexture('flare/lensflare1.png');
var textureFlare2 = THREE.ImageUtils.loadTexture('flare/lensflare2.png');
var textureFlare3 = THREE.ImageUtils.loadTexture('flare/lensflare3.png');

light.position.set(5000, 0, 0);


function addLensFlare(x,y,z,size,overrideImage,hueShift){
  var flareColor = new THREE.Color(0xffffff);
  flareColor.offsetHSL(0.08, 0.5, 0.5);
  var lensFlare = new THREE.LensFlare(textureFlare0, 700, 0, THREE.AdditiveBlending, flareColor);
  lensFlare.add(textureFlare1, 4096, 0.0, THREE.AdditiveBlending);
  lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
  lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
  lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
  lensFlare.customUpdateCallback = function(object){
    var f, fl = this.lensFlares.length;
    var flare;
    var vecx = -this.positionScreen.x * 2;
    var vecy = -this.positionScreen.y * 2;
    var size = object.size || 16000;
    var camDistance = camera.position.length();
    for (f = 0; f < fl; f++){
      flare = this.lensFlares[f];
      flare.x = this.positionScreen.x + vecx * flare.distance;
      flare.y = this.positionScreen.y + vecy * flare.distance;
      flare.scale = size / camDistance;
    }
  };
  lensFlare.position = new THREE.Vector3(x,y,z);
  lensFlare.size = size || 16000;
  return lensFlare;
}
//var flare = new THREE.PointCloud
//scene.add(addLensFlare(light.position.x, light.position.y, light.position.z))
renderer.setClearColor(0x000000);
scene.add(new THREE.AmbientLight(0x505050));
camera.lookAt(scene.position);
camera.position.set(0.0, 0.0, 4000);
renderer.setSize(window.innerWidth, window.innerHeight);
globe.position.set(0.0, 0.0, 0.0);
scene.add(globe);
scene.add(light);
fxaaPass.uniforms.resolution.value.set(1/window.innerWidth, 1/window.innerHeight);
filmPass.uniforms.grayscale.value = 0;
oculus.setSize(window.innerWidth, window.innerHeight);
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(renderPass);
//composer.addPass(bleachPass);
//composer.addPass(fxaaPass);
composer.addPass(bloomPass);
//composer.addPass(filmPass);
//composer.addPass(luminosityPass);
composer.addPass(copyPass);
copyPass.renderToScreen = true;
document.body.appendChild(renderer.domElement);
controls.addEventListener('change', render);
document.addEventListener('keypress', function(e){
  if (e.keyCode === 32){
    //useComposer = !useComposer;
    clock.start();
  }
});
render();
animate();