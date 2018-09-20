let ww = window.innerWidth, wh = window.innerHeight;
let input, audioPlayer, audio, output, fft, spectrum, analyser, dataArray, bufferLength, fileList = [];
let geometry, material, ball, ballGroup, ambientLight, options, lights, gui, delta;

let clock = new THREE.Clock();
var noise = new SimplexNoise();
input = document.querySelector('#file');
audioPlayer = document.querySelector('#audio');
output = document.querySelector('.output');

let dropArea = document.getElementById('drop-area');
let uploadButton = document.querySelector('.upload-btn');
let fileInput = document.querySelector('#upload');
let supportedFormats = [
    'mp3',
    'wav',
    'ogg',
    'm4a',
    'aac'
];

// Old Colors: spotLights: [0x0e45cd, 0x21ca7b], ambientLight: 0x580493

options = {
    camera: {
        fov: 70,
    },
    spotLights: [
        {
            color: 0x4b6a87,
            intensity: 0.6,
            shadow: true,
            position: [150, 80, 200] // x, y, z
        },
        {
            color: 0x21ca7b,
            intensity: 0.9,
            shadow: true,
            position: [-50, 80, 20] // x, y, z
        }
    ],
    ambientLight: {
        color: 0x000000,
        intensity: 0.6,
    }
};

uploadButton.addEventListener('click', () => {
    fileInput.click();
});


let dragEventTypes = ['dragenter','dragleave','dragover','drop'];

dragEventTypes.forEach(type => {
    dropArea.addEventListener(type, handlerFunction, false);
});

function handlerFunction(e) {
    e.preventDefault();
    e.stopPropagation();
    changeDropAreaClass(e.type);
    if(e.type === 'drop') load(e.dataTransfer.files);
}

function changeDropAreaClass(type){
    if(type === 'dragenter' || type === 'dragover'){
        dropArea.classList.add('dragging')
    }else{
        dropArea.classList.remove('dragging');
    }
}

function getFileFormat(file) {
    return file.name.split('.').pop();
}

function isSupportedFile(ext){
    return supportedFormats.includes(ext);
}

function load(files) {
    for(let i = 0; i < files.length; i++){
        let file = files[i];
        let ext = getFileFormat(file);
        if(isSupportedFile(ext)){
            dropArea.classList.add('hide');
            fileList.push(file)
        }else{
            alertify.error('Not Supported type \''+ext+'\'');
        }
    }
    if(!fileList.length) return;

    initVisualization();
    new p5.SoundFile(fileList[0], initAudio);
}

function initPanel() {
    let ambLight = gui.addFolder('Ambient Light');
    ambLight.addColor(options.ambientLight, 'color')
        .onChange(e => ambientLight.color.set(new THREE.Color(e)));

    options.spotLights.forEach((light, i) => {
        let lgt = gui.addFolder(`Spot Light ${i + 1}`);
        lgt.add(options.spotLights[i], 'intensity', 0, 1)
            .onChange((e) => {
                lights[i].intensity = e;
                update()
            });
        lgt.addColor(options.spotLights[i], 'color')
            .onChange(e => {
                lights[i].color.set(new THREE.Color(e));
                update()
            });

    })
}

function initLights(lightOpts, centarlFigure, callback) {
    lightOpts.forEach((opts,i) => {
        let light = new THREE.SpotLight(opts.color, opts.intensity);
        light.position.set(...opts.position);
        light.lookAt(centarlFigure);
        light.castShadow = opts.shadow;
        lights.push(light);
        callback(lights[i])
    })
}

let opts = {
    ball: {
        geometry: {
            radius: 20,
            detail: 4
        },
        material: {
            color: 0xffffff,
            wireframe: true,
        }
    },

    camera: {
        position: [0,0,100], // x, y, z
        fow: 70,   // Camera frustum vertical field of view.
        near: 0.1, // Camera frustum near plane.
        far: 1000  // Camera frustum far plane
    },
    spotLights: [
        {
            color: 0x4b6a87,
            intensity: 0.6,
            shadow: true,
            position: [150, 80, 200] // x, y, z
        },
        {
            color: 0x21ca7b,
            intensity: 0.9,
            shadow: true,
            position: [-50, 80, 20] // x, y, z
        }
    ],
    ambientLight: {
        color: 0x000000,
        intensity: 0.6,
    }
}

function initVisualization(audioSource) {
    let visualization = new SoundVisualisation(opts);
    console.log(x);
    gui = new dat.GUI();
    scene = new THREE.Scene();
    ballGroup = new THREE.Group();

    camera = new THREE.PerspectiveCamera(options.camera.fov, ww / wh, 0.1, 1000);
    ambientLight = new THREE.AmbientLight(options.ambientLight.color, options.ambientLight.intensity);

    camera.position.set(0, 0, 100);
    camera.lookAt(scene.position);

    geometry = new THREE.IcosahedronGeometry(20, 4);
    material = new THREE.MeshLambertMaterial({
        color: 0xffffff, //0xff00ee
        wireframe: true,
    });


    ball = new THREE.Mesh(geometry, material);
    ball.position.set(0, 0, 0);

    lights = [];
    initLights(options.spotLights, ball, light => ballGroup.add(light));
    ballGroup.add(ball);

    scene.add(ballGroup);
    scene.add(ambientLight);
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
    renderer.setClearColor(0x080808, 1);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    initPanel();
    renderer.render(scene, camera);
}

function initAudio(a) {
    fft = new p5.FFT();
    fft.setInput(a);
    audio = a;
    animate();
}

upload.addEventListener('change', (e) => {
    load(e.target.files);
});

function bass(level) {
    if(level <= 230) return;
    ball.position.x = Math.cos(Date.now() * level) * 0.3;
    ball.position.y = Math.cos(Date.now() * level) * 0.3;
    ball.position.z = Math.cos(Date.now() * level) * 0.3;
}

function animate() {

    var spectrum = fft.analyze();
    var lowLvls = fft.getEnergy("bass")
    var allLvls = fft.getEnergy("treble");
    var highMid = fft.getEnergy("highMid");
    var centroid = fft.getCentroid();

    delta = clock.getDelta() * (lowLvls * 0.01);
    bass(lowLvls);


    ballGroup.rotation.z += 0.005;
    ballGroup.position.z = (lowLvls * 0.18);
    camera.updateProjectionMatrix();
    makeRoughBall(ball, lowLvls * 0.05, (centroid + highMid) * 0.0001);
    requestAnimationFrame(animate);
    update();
}

function update() {
    renderer.render(scene, camera);
    console.log()
}


function makeRoughBall(mesh, bassFr, treFr) {
    mesh.geometry.vertices.forEach(function (vertex) {
        let x, y, z, offset, time, distance;

        offset = mesh.geometry.parameters.radius;
        time = Date.now();
        vertex.normalize();

        x = vertex.x + time * 0.00025;
        y = vertex.y + time * 0.00035;
        z = vertex.z + time * 0.00045;
        distance = (offset) + noise.noise3D(x, y, z) * 4 * treFr;

        vertex.multiplyScalar(distance);
    });
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeFaceNormals();
}