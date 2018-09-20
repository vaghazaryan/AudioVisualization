class SoundVisualisation {
    constructor(options) {
        if (options instanceof Object) {
            this.options = options;
        }

        this.clock          = new THREE.Clock();
        this.scene          = new THREE.Scene();
        this.group          = new THREE.Group();
        this.noise          = new SimplexNoise();
        this.camera         = this._makeCamera();
        this.ball           = this._makeBall();
        this.ambientLight   = this._makeAmbientLight();
        this.renderer       = this._makerenderer();
        this.animationFrame = null;
        this.audioSource    = Object.assign({});

    }

    get aspect() {
        return window.innerWidth / window.innerHeight
    }

    set audioInput(source) {
        this.audioSource = source;
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
        ball = new THREE.Mesh(geometry, material);
        ball.position.set(0, 0, 0);
        return ball
    }

    _makeAmbientLight() {
        let ao = this.options.ambientLight;
        return new THREE.AmbientLight(ao.color, ao.intensity)
    }

    _makerenderer() {
        let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        renderer.setClearColor(0x080808, 1);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }
}


SoundVisualisation.prototype.makePointLights = function() {
    let lights = this.options.spotLights;
    lights.forEach(sl => {
        let light = new THREE.SpotLight(sl.color, sl.intensity);
        light.position.set(...sl.position);
        light.lookAt(this.ball);
        light.castShadow = sl.shadow;
        this.group.add(light);
    })
};

SoundVisualisation.prototype.animate = function() {
    let lowLevels, allLevels, highMidLevels, centroid;
    this.audioSource.analyze();
    lowLevels = fft.getEnergy("bass")
    allLevels = fft.getEnergy("treble");
    highMidLevels = fft.getEnergy("highMid");
    centroid = fft.getCentroid();

    this.group.rotation.z += 0.005;
    this.group.position.z = (lowLevels * 0.18);
    this.makebeats(lowLevels);

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
    this.render();
    this.group.add(this.ball);
    this.scene.add(this.group);
    this.scene.add(this.ambientLight);
    this.scene.add(this.camera);
    this.makePointLights();
    return this;
};