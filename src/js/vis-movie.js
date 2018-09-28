class SoundVisualisation {
    constructor(options) {
        if (options instanceof Object) {
            this.options = options;
        }

        this.clock          = new THREE.Clock();
        this.scene          = new THREE.Scene();
        this.group          = new THREE.Group();
        this.ligthgroup     = new THREE.Group();
        this.noise          = new SimplexNoise();
        this.camera         = this._makeCamera();
        this.ball           = this._makeBall();
        this.ambientLight   = this._makeAmbientLight();
        this.renderer       = this._makerenderer();
        this.animationFrame = null;
        this.fft            = null;
        this.audioSource    = Object.assign({});
        this.composer =     this._makeGlichEffect();

    }

    get aspect() {
        return window.innerWidth / window.innerHeight
    }

    set audioInput(source) {
        this.audioSource = new p5.FFT();
        this.audioSource.setInput(source);
        this.animate();
    }

    _makeCamera(){
        let co = this.options.camera;
        let camera = new THREE.PerspectiveCamera(co.fov, this.aspect, co.near, co.far);
        camera.position.set(...co.position);
        camera.lookAt(this.scene.position);
        return camera
    }

    _makeBall() {
        let bo, geometry, material, ball;
        bo = this.options.ball;
        geometry = new THREE.IcosahedronGeometry(bo.geometry.radius, bo.geometry.detail);
        material = new THREE.MeshLambertMaterial(bo.material);
        ball = new THREE.SceneUtils.createMultiMaterialObject(geometry, [material]);
        ball.position.set(0, 0, 0);
        return ball
    }

    _makeAmbientLight() {
        let ao = this.options.ambientLight;
        return new THREE.AmbientLight(ao.color, ao.intensity)
    }

    _makerenderer() {
        let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        // renderer.setClearColor(0x080808, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(new THREE.Color(0x000, 1.0));
        renderer.shadowMapEnabled = true;
        document.body.appendChild(renderer.domElement);
        return renderer;
    }

    _makeGlichEffect() {
        var renderPass = new THREE.RenderPass(this.scene, this.camera);
        var effectFilm = new THREE.FilmPass(0.8, 0.325, 256, false);
        effectFilm.renderToScreen = true;

        effectFilm.uniforms.grayscale.value = false;
        effectFilm.uniforms.nIntensity.value = 0.8;
        effectFilm.uniforms.sIntensity.value = 1.5;
        effectFilm.uniforms.sCount.value = 256;

        var composer = new THREE.EffectComposer(this.renderer);
        composer.addPass(renderPass);
        composer.addPass(effectFilm);

        return composer
    }
}


SoundVisualisation.prototype.makePointLights = function() {
    let lights = this.options.spotLights;
    lights.forEach(sl => {
        let light = new THREE.SpotLight(sl.color, sl.intensity);
        light.name = sl.name;
        light.position.set(...sl.position);
        light.lookAt(this.ball);
        light.castShadow = sl.shadow;
        this.ligthgroup.add(light);
    })
};

SoundVisualisation.prototype.animate = function() {
    let _self = this;
    window.cancelAnimationFrame(_self.animationFrame);
    let lowLevels, allLevels, highMidLevels, centroid;
    this.audioSource.analyze();
    lowLevels = this.audioSource.getEnergy("bass")
    allLevels = this.audioSource.getEnergy("treble");
    highMidLevels = this.audioSource.getEnergy("highMid");
    centroid = this.audioSource.getCentroid();

    this.group.rotation.z += 0.005;
    this.group.position.z = this.ligthgroup.position.z = (lowLevels * 0.18);
    this.ligthgroup.getObjectByName('dark').intensity = 0.8 - (0.5 * Math.cos(highMidLevels * 0.015));

    this.makebeats(lowLevels);

    this.composer.render(this.clock.getDelta());

    this.camera.updateProjectionMatrix();
    this.makeRoughBall(lowLevels * 0.05, (centroid + highMidLevels) * 0.0001);
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    this.render();
};

SoundVisualisation.prototype.makeRoughBall = function(bassFr, treFr) {
    this.ball.geometry.vertices.forEach((vertex) => {
        let x, y, z, offset, time, distance;

        offset = this.ball.geometry.parameters.radius;
        time = Date.now();
        vertex.normalize();

        x = vertex.x + time * 0.00025;
        y = vertex.y + time * 0.00035;
        z = vertex.z + time * 0.00045;
        distance = offset + this.noise.noise3D(x, y, z) * 4 * treFr;

        vertex.multiplyScalar(distance);
    });
    this.ball.geometry.verticesNeedUpdate = true;
    this.ball.geometry.normalsNeedUpdate = true;
    this.ball.geometry.computeVertexNormals();
    this.ball.geometry.computeFaceNormals();
};

SoundVisualisation.prototype.makebeats = function(LowlevelPoint) {
    if(LowlevelPoint <= 230) return;
    this.ball.position.x = Math.cos(Date.now() * LowlevelPoint) * 0.3;
    this.ball.position.y = Math.cos(Date.now() * LowlevelPoint) * 0.3;
    this.ball.position.z = Math.cos(Date.now() * LowlevelPoint) * 0.3;
};

SoundVisualisation.prototype.updateSceneScreenSize = function() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.render();
};

SoundVisualisation.prototype.render = function() {
  this.renderer.render(this.scene, this.camera)
};

SoundVisualisation.prototype.init = function() {
    let self = this;
    this.render();
    this.group.add(this.ball);
    this.scene.add(this.group);
    this.scene.add(this.ambientLight);
    this.scene.add(new THREE.SceneUtils.createMultiMaterialObject(new THREE.SphereGeometry(10, 40, 40)), [self.ball]);
    this.scene.add(this.ligthgroup);
    this.scene.add(this.camera);
    this.makePointLights();
    this._makeGlichEffect();
    return this;
};