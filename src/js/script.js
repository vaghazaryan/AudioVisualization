let input, player, audio, output, fft, fileList = [];
let options, gui, visualization;

let clock = new THREE.Clock();
var noise = new SimplexNoise();

input = document.querySelector('#file');
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
};

visualization = new SoundVisualisation(opts).init();
player = new Player('.player');

window.addEventListener( 'resize', () => {
    visualization.updateSceneScreenSize()
}, false );

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
    new p5.SoundFile(fileList[0], initAudio);
}

function initAudio(audio) {
    fft = new p5.FFT();
    fft.setInput(audio);
    fft.analyze();
    player.audioInput = audio;
    visualization.audioInput = fft;
}

upload.addEventListener('change', (e) => {
    load(e.target.files);
});
