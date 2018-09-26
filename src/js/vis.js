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
        this.circle           = this._makeCircle();
        this.skelete        = this._makeSkelete();
        this.ambientLight   = this._makeAmbientLight();
        this.renderer       = this._makerenderer();
        this.animationFrame = null;
        this.fft            = null;
        this.audioSource    = Object.assign({});

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
        let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.z = 400;
        camera.lookAt(this.scene.position);
        return camera
    }

    _makeCircle() {
        var geom = new THREE.IcosahedronGeometry(7, 1);

        var mat = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shading: THREE.FlatShading
        });

        var planet = new THREE.Mesh(geom, mat);
        planet.scale.x = planet.scale.y = planet.scale.z = 16;

        return planet;
    }

    _makeSkelete() {
        var geom2 = new THREE.IcosahedronGeometry(15, 1);
        var mat2 = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            wireframe: true,
            side: THREE.DoubleSide

        });

        var planet2 = new THREE.Mesh(geom2, mat2);
        planet2.scale.x = planet2.scale.y = planet2.scale.z = 10;

        return planet2;
    }

    _makeAmbientLight() {
        return new THREE.AmbientLight(0x999999 );
    }

    _makerenderer() {
        let renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
        renderer.setClearColor(0x000000, 0.0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        return renderer;
    }
}


SoundVisualisation.prototype.makePointLights = function() {
    // let lights = this.options.spotLights;
    var lights = [];
    lights[0] = new THREE.DirectionalLight( 0xffffff, 1 );
    lights[0].position.set( 1, 0, 0 );
    lights[1] = new THREE.DirectionalLight( 0x11E8BB, 1 );
    lights[1].position.set( 0.75, 1, 0.5 );
    lights[2] = new THREE.DirectionalLight( 0x8200C9, 1 );
    lights[2].position.set( -0.75, -1, 0.5 );
    this.ligthgroup.add( lights[0] );
    this.ligthgroup.add( lights[1] );
    this.ligthgroup.add( lights[2] );
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
    this.group.position.z = (lowLevels * 0.18);

    // this.makebeats(lowLevels);

    this.camera.updateProjectionMatrix();
    this.makeRoughBall(lowLevels * 0.05, (centroid + highMidLevels) * 0.0001);
    this.animationFrame = requestAnimationFrame(this.animate.bind(this));
    this.render();
};

SoundVisualisation.prototype.makeRoughBall = function(bassFr, treFr) {
    this.skelete.geometry.vertices.forEach((vertex) => {
        let x, y, z, offset, time, distance;

        offset = this.skelete.geometry.parameters.radius;
        time = Date.now();
        vertex.normalize();

        x = vertex.x + time * 0.00025;
        y = vertex.y + time * 0.00035;
        z = vertex.z + time * 0.00045;
        distance = offset + this.noise.noise3D(x, y, z) * 4 * treFr;

        vertex.multiplyScalar(distance);
    });

    this.circle.geometry.verticesNeedUpdate = true;
    this.circle.geometry.normalsNeedUpdate = true;
    this.circle.geometry.computeVertexNormals();
    this.circle.geometry.computeFaceNormals();

    this.skelete.geometry.verticesNeedUpdate = true;
    this.skelete.geometry.normalsNeedUpdate = true;
    this.skelete.geometry.computeVertexNormals();
    this.skelete.geometry.computeFaceNormals();
};

SoundVisualisation.prototype.makebeats = function(LowlevelPoint) {
    if(LowlevelPoint <= 230) return;
    this.group.position.x = Math.cos(Date.now() * LowlevelPoint) * 0.3;
    this.group.position.y = Math.cos(Date.now() * LowlevelPoint) * 0.3;
    this.group.position.z = Math.cos(Date.now() * LowlevelPoint) * 0.3;
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
    this.group.add(this.circle);
    this.group.add(this.skelete);
    this.scene.add(this.ligthgroup);

    this.scene.add(this.group);
    this.scene.add(this.ambientLight);
    this.scene.add(this.camera);
    this.makePointLights();
    return this;
};