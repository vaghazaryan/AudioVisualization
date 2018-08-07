var camera, scene, renderer;
var geometry, material, ball, spotLight, ambientLight, file, audio, analyser, dataArray, bufferLength;
var noise = new SimplexNoise();

let output = document.querySelector('.output');
file = document.querySelector('#file');
audio = document.getElementById("audio");
file.onchange = loadFile;

init();


function loadFile(){
    files = this.files;
    audio.src = URL.createObjectURL(files[0]);
    audio.load();
    audio.play();
    var context = new AudioContext();
    var src = context.createMediaElementSource(audio);
    analyser = context.createAnalyser();
    src.connect(analyser);
    analyser.connect(context.destination);
    analyser.fftSize = 512;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    animate();
}


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0,0,100);
    camera.lookAt(scene.position);
    scene.add(camera);

    geometry = new THREE.IcosahedronGeometry(20, 4);
    material = new THREE.MeshLambertMaterial({
        color: 0xff00ee, //0xff00ee
        wireframe: true
    });

    ambientLight = new THREE.AmbientLight(0x42f4c8);

    ball = new THREE.Mesh(geometry, material);
    ball.position.set(0, 0, 0);

    spotLight = new THREE.SpotLight(0xffffff);
    spotLight.intensity = 0.9;
    spotLight.position.set(-50, 40, 20);
    spotLight.lookAt(ball);
    spotLight.castShadow = true;

    scene.add(ambientLight);
    scene.add(spotLight);
    scene.add(ball);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor( 0x080808, 1);
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

}

function makeRoughBall(mesh, bassFr, treFr) {
    mesh.geometry.vertices.forEach(function (vertex, i) {
        var offset = mesh.geometry.parameters.radius;
        var time = Date.now();
        vertex.normalize();
        var distance = (offset + bassFr ) + noise.noise3D(vertex.x + time * 0.00007, vertex.y +  time * 0.00008, vertex.z +  time * 0.00009) * 3 * treFr;

        vertex.multiplyScalar(distance);
    });
    mesh.geometry.verticesNeedUpdate = true;
    mesh.geometry.normalsNeedUpdate = true;
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeFaceNormals();
}

// document.addEventListener('mousemove', (e) => {
//     mouseX = event.clientX - window.innerWidth / 2;
//     mouseY = event.clientY - window.innerHeight / 2;
//     camera.position.x = (mouseX - camera.position.x) / 10;
//     camera.position.y = (mouseY - camera.position.y) / 10;
//     //set up camera position
//     camera.lookAt(scene.position);
// });

//some helper functions here
function fractionate(val, minVal, maxVal) {
    return (val - minVal)/(maxVal - minVal);
}

function modulate(val, minVal, maxVal, outMin, outMax) {
    var fr = fractionate(val, minVal, maxVal);
    var delta = outMax - outMin;
    return outMin + (fr * delta);
}
function avg(arr){
    var total = arr.reduce(function(sum, b) { return sum + b; });
    return (total / arr.length);
}

function max(arr){
    return arr.reduce(function(a, b){ return Math.max(a, b); })
}

function animate() {


    // output.innerHTML = spectrum;


    analyser.getByteFrequencyData(dataArray);

    var lowerHalfArray = dataArray.slice(0, (dataArray.length/2) - 1);
    var upperHalfArray = dataArray.slice((dataArray.length/2) - 1, dataArray.length - 1);

    var overallAvg = avg(dataArray);
    var lowerMax = max(lowerHalfArray);
    var lowerAvg = avg(lowerHalfArray);
    var upperMax = max(upperHalfArray);
    var upperAvg = avg(upperHalfArray);

    var lowerMaxFr = lowerMax / lowerHalfArray.length;
    var lowerAvgFr = lowerAvg / lowerHalfArray.length;
    var upperMaxFr = upperMax / upperHalfArray.length;
    var upperAvgFr = upperAvg / upperHalfArray.length;

    ball.rotation.y += 0.002;
    // ball.rotation.x += 0.009;

    makeRoughBall(ball, modulate(Math.pow(lowerMaxFr, lowerAvg / 100), 0, 1, 0, 8), modulate(upperAvgFr, 0, 1, 0, 4));

    requestAnimationFrame( animate );
    renderer.render( scene, camera );

}