THREE.OculusShader = {
  uniforms: {
    "texid": { type: "t", value: new THREE.Texture() },
    "scale": { type: "v2", value: new THREE.Vector2(1.0,1.0) },
    "scaleIn": { type: "v2", value: new THREE.Vector2(1.0,1.0) },
    "lensCenter": { type: "v2", value: new THREE.Vector2(0.0,0.0) },
    "hmdWarpParam": { type: "v4", value: new THREE.Vector4(1.0,0.0,0.0,0.0) },
    "chromAbParam": { type: "v4", value: new THREE.Vector4(1.0,0.0,0.0,0.0) }
  },
  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    " vUv = uv;",
    "	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join("\n"),

  fragmentShader: [
    "uniform vec2 scale;",
    "uniform vec2 scaleIn;",
    "uniform vec2 lensCenter;",
    "uniform vec4 hmdWarpParam;",
    'uniform vec4 chromAbParam;',
    "uniform sampler2D texid;",
    "varying vec2 vUv;",
    "void main()",
    "{",
    "  vec2 uv = (vUv*2.0)-1.0;", // range from [0,1] to [-1,1]
    "  vec2 theta = (uv-lensCenter)*scaleIn;",
    "  float rSq = theta.x*theta.x + theta.y*theta.y;",
    "  vec2 rvector = theta*(hmdWarpParam.x + hmdWarpParam.y*rSq + hmdWarpParam.z*rSq*rSq + hmdWarpParam.w*rSq*rSq*rSq);",
    '  vec2 rBlue = rvector * (chromAbParam.z + chromAbParam.w * rSq);',
    "  vec2 tcBlue = (lensCenter + scale * rBlue);",
    "  tcBlue = (tcBlue+1.0)/2.0;", // range from [-1,1] to [0,1]
    "  if (any(bvec2(clamp(tcBlue, vec2(0.0,0.0), vec2(1.0,1.0))-tcBlue))) {",
    "    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);",
    "    return;}",
    "  vec2 tcGreen = lensCenter + scale * rvector;",
    "  tcGreen = (tcGreen+1.0)/2.0;", // range from [-1,1] to [0,1]
    "  vec2 rRed = rvector * (chromAbParam.x + chromAbParam.y * rSq);",
    "  vec2 tcRed = lensCenter + scale * rRed;",
    "  tcRed = (tcRed+1.0)/2.0;", // range from [-1,1] to [0,1]
    "  gl_FragColor = vec4(texture2D(texid, tcRed).r, texture2D(texid, tcGreen).g, texture2D(texid, tcBlue).b, 1);",
    "}"
  ].join("\n")
};

THREE.OculusRenderPass = function(scene, camera, options, overrideMaterial, clearColor, clearAlpha) {
  this.scene = scene;
  this.camera = camera;
  this.overrideMaterial = overrideMaterial;
  this.clearColor = clearColor;
  this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha: 1;
  this.oldClearColor = new THREE.Color();
  this.oldClearAlpha = 1;
  this.enabled = true;
  this.clear = true;
  this.needsSwap = false;
  this.worldFactor = (options && options['worldFactor']) ? options['worldFactor'] : 1.0;
  this.HMD = (options && options.HMD) ? options.HMD : {
    hResolution           : 1920,
    vResolution           : 1080,
    hScreenSize           : 0.12576,
    vScreenSize           : 0.07074,
    interpupillaryDistance: 0.0635,
    lensSeparationDistance: 0.0635,
    eyeToScreenDistance   : 0.041,
    distortionK           : [1.0, 0.22, 0.24, 0.0],
    chromaAbParameter     : [0.996, -0.004, 1.014, 0.0]
  };
  this.pCamera = new THREE.PerspectiveCamera();
  this.pCamera.matrixAutoUpdate = false;
  this.pCamera.target = new THREE.Vector3();
  this.oCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
  this.oCamera.position.z = 1;
  this.preLeftRender = function () {};
  this.preRightRender = function () {};
  this.RTParams = {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter,
    format   : THREE.RGBAFormat
  };
  this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth / 2, window.innerHeight, this.RTParams);
  this.RTMaterial = new THREE.ShaderMaterial(THREE.OculusShader);
  var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.RTMaterial);
  this.finalScene = new THREE.Scene();
  this.finalScene.add(this.oCamera);
  this.finalScene.add(mesh);
  this.left = {};
  this.right = {};
  this.distScale = 1.0;
  this.setHMD(this.HMD);
};

THREE.OculusRenderPass.prototype = {
  setHMD : function (v) {
    this.HMD = v;
    var aspect = this.HMD.hResolution / (2 * this.HMD.vResolution);
    var r = -1.0 - (4 * (this.HMD.hScreenSize / 4 - this.HMD.lensSeparationDistance / 2) / this.HMD.hScreenSize);
    this.distScale = (this.HMD.distortionK[0] + this.HMD.distortionK[1] * Math.pow(r, 2) + this.HMD.distortionK[2] * Math.pow(r, 4) + this.HMD.distortionK[3] * Math.pow(r, 6));
    var fov = THREE.Math.radToDeg(2 * Math.atan2(this.HMD.vScreenSize * this.distScale, 2 * this.HMD.eyeToScreenDistance));
    var proj = (new THREE.Matrix4()).makePerspective(fov, aspect, 0.3, 10000);
    var h = 4 * (this.HMD.hScreenSize / 4 - this.HMD.interpupillaryDistance / 2) / this.HMD.hScreenSize;
    this.left.proj = ((new THREE.Matrix4()).makeTranslation(h, 0.0, 0.0)).multiply(proj);
    this.right.proj = ((new THREE.Matrix4()).makeTranslation(-h, 0.0, 0.0)).multiply(proj);
    this.left.tranform = (new THREE.Matrix4()).makeTranslation(-this.worldFactor * this.HMD.interpupillaryDistance / 2, 0.0, 0.0);
    this.right.tranform = (new THREE.Matrix4()).makeTranslation(this.worldFactor * this.HMD.interpupillaryDistance / 2, 0.0, 0.0);
    this.left.viewport = [0, 0, this.HMD.hResolution / 2, this.HMD.vResolution];
    this.right.viewport = [this.HMD.hResolution / 2, 0, this.HMD.hResolution / 2, this.HMD.vResolution];
    var lensShift = 4 * (this.HMD.hScreenSize / 4 - this.HMD.lensSeparationDistance / 2) / this.HMD.hScreenSize;
    this.left.lensCenter = new THREE.Vector2(lensShift, 0.0);
    this.right.lensCenter = new THREE.Vector2(-lensShift, 0.0);
    this.RTMaterial.uniforms['hmdWarpParam'].value = new THREE.Vector4(this.HMD.distortionK[0], this.HMD.distortionK[1], this.HMD.distortionK[2], this.HMD.distortionK[3]);
    this.RTMaterial.uniforms['chromAbParam'].value = new THREE.Vector4(this.HMD.chromaAbParameter[0], this.HMD.chromaAbParameter[1], this.HMD.chromaAbParameter[2], this.HMD.chromaAbParameter[3]);
    this.RTMaterial.uniforms['scaleIn'].value = new THREE.Vector2(1.0, 1.0 / aspect);
    this.RTMaterial.uniforms['scale'].value = new THREE.Vector2(1.0 / this.distScale, aspect / this.distScale);
  },
  setSize: function (width, height) {
    this.left.viewport = [width / 2 - this.HMD.hResolution / 2, height / 2 - this.HMD.vResolution / 2, this.HMD.hResolution / 2, this.HMD.vResolution];
    this.right.viewport = [width / 2, height / 2 - this.HMD.vResolution / 2, this.HMD.hResolution / 2, this.HMD.vResolution];
  },

  render: function (renderer, writeBuffer, readBuffer) {
    renderer.autoClear = false;
    if(this.renderTarget) this.renderTarget.dispose();
    this.renderTarget = new THREE.WebGLRenderTarget((this.HMD.hResolution * this.distScale / 2) * renderer.devicePixelRatio, (this.HMD.vResolution * this.distScale) * renderer.devicePixelRatio, this.RTParams);
    this.RTMaterial.uniforms["texid"].value = this.renderTarget;
    this.scene.overrideMaterial = this.overrideMaterial;
    if(camera.matrixAutoUpdate) camera.updateMatrix();
    if(this.clearColor) {
      this.oldClearColor.copy(renderer.getClearColor());
      this.oldClearAlpha = renderer.getClearAlpha();
      renderer.setClearColor(this.clearColor, this.clearAlpha);
    }
    if(this.clear) {
      renderer.clear();
    }
    // Render left
    this.preLeftRender();
    this.pCamera.projectionMatrix.copy(this.left.proj);
    this.pCamera.matrix.copy(this.camera.matrix).multiply(this.left.tranform);
    this.pCamera.matrixWorldNeedsUpdate = true;
    renderer.setViewport(this.left.viewport[0], this.left.viewport[1], this.left.viewport[2], this.left.viewport[3]);
    this.RTMaterial.uniforms['lensCenter'].value = this.left.lensCenter;
    renderer.render(this.scene, this.pCamera, this.renderTarget, true);
    renderer.render(this.finalScene, this.oCamera, readBuffer, true);

    // Render right
    this.preRightRender();
    this.pCamera.projectionMatrix.copy(this.right.proj);
    this.pCamera.matrix.copy(this.camera.matrix).multiply(this.right.tranform);
    this.pCamera.matrixWorldNeedsUpdate = true;
    renderer.setViewport(this.right.viewport[0], this.right.viewport[1], this.right.viewport[2], this.right.viewport[3]);
    this.RTMaterial.uniforms['lensCenter'].value = this.right.lensCenter;
    renderer.render(this.scene, this.pCamera, this.renderTarget, true);
    renderer.render(this.finalScene, this.oCamera, readBuffer, false);
    if(this.clearColor) {
      renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);
    }
    this.scene.overrideMaterial = null;
  }
};