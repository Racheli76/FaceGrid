const video = document.getElementById('webcam');
const container = document.getElementById('canvas-container');
const countdownOverlay = document.getElementById('countdown-overlay');

const processingCanvas = document.createElement('canvas');
processingCanvas.width = 128;
processingCanvas.height = 128;
const pCtx = processingCanvas.getContext('2d');

let scene, camera, renderer, faceMesh, videoTexture, geometry, material;
let lightLeft, lightRight;
let currentMode = 'classic';
let currentHexColor = '#ffffff';
let depthMultiplier = 19; // ערך ברירת מחדל לעוצמת התלת-ממד
let currentLang = 'he';

// משתני הקלטה
let mediaRecorder;
let recordedChunks = [];
let isRecording = false;

// מילון תרגום מובנה
const translations = {
    he: {
        classic: "אווטאר אנושי 3D",
        particles: "פיקסלים מרחפים",
        liquid: "גלי מים נוזליים",
        grid: "רשת גיאומטרית",
        rain: "טיפות מטריקס",
        photo: "📸 צילום (4 שנ')",
        record: "🎥 הקלטת וידאו",
        stopRecord: "🛑 עצור הקלטה",
        color: "צבע אפקט",
        depth: "עוצמת עומק",
        camVisible: "מצלמה גלויה",
        camHidden: "מצלמה חבויה"
    },
    en: {
        classic: "3D Human Avatar",
        particles: "Floating Pixels",
        liquid: "Liquid Waves",
        grid: "Geometric Grid",
        rain: "Matrix Rain",
        photo: "📸 Take Photo (4s)",
        record: "🎥 Record Video",
        stopRecord: "🛑 Stop Recording",
        color: "Effect Color",
        depth: "Depth Intensity",
        camVisible: "Camera Visible",
        camHidden: "Camera Hidden"
    }
};

navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: true })
    .then(stream => {
        video.srcObject = stream;
        init3DStudio();
    })
    .catch(err => alert("יש לאשר גישה למצלמה והמיקרופון."));

function init3DStudio() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040408);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 135);

    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    lightLeft = new THREE.DirectionalLight(new THREE.Color(currentHexColor), 1.6);
    lightLeft.position.set(-40, 20, 90);
    scene.add(lightLeft);

    lightRight = new THREE.DirectionalLight(0xff0077, 0.4);
    lightRight.position.set(40, -20, 90);
    scene.add(lightRight);

    const ambientLight = new THREE.AmbientLight(0x222233, 0.6);
    scene.add(ambientLight);

    videoTexture = new THREE.VideoTexture(video);
    videoTexture.wrapS = THREE.RepeatWrapping;
    videoTexture.repeat.x = -1;
    videoTexture.offset.x = 1;

    buildFaceMesh();

    let targetRotationX = 0, targetRotationY = 0;
    window.addEventListener('mousemove', (e) => {
        targetRotationY = (e.clientX / window.innerWidth) * 2 - 1;
        targetRotationX = (e.clientY / window.innerHeight) * 2 - 1;
    });

    function renderLoop() {
        requestAnimationFrame(renderLoop);

        if (video.readyState === video.HAVE_ENOUGH_DATA) {
            pCtx.drawImage(video, 80, 0, 480, 480, 0, 0, 128, 128);
            const imgData = pCtx.getImageData(0, 0, 128, 128);
            const data = imgData.data;

            const positions = geometry.attributes.position;
            let vertexIndex = 0;
            const time = Date.now() * 0.002;

            for (let y = 0; y < 128; y++) {
                for (let x = 0; x < 128; x++) {
                    const mirrorX = 127 - x;
                    const i = (y * 128 + mirrorX) * 4;
                    const brightness = (data[i] + data[i+1] + data[i+2]) / 3;

                    let targetZ = 0;
                    if (brightness > 40) {
                        // שימוש במשתנה הדינמי מהסליידר
                        targetZ = (brightness / 255) * depthMultiplier;
                        
                        if (currentMode === 'liquid') {
                            targetZ += Math.sin(x * 0.15 + time) * 3.5 + Math.cos(y * 0.15 + time) * 3.5;
                        }
                    }
                    
                    positions.setZ(vertexIndex, targetZ);
                    vertexIndex++;
                }
            }
            geometry.attributes.position.needsUpdate = true;
            geometry.computeVertexNormals();
        }

        faceMesh.rotation.y += (-targetRotationY * 0.5 - faceMesh.rotation.y) * 0.08;
        faceMesh.rotation.x += (targetRotationX * 0.3 - faceMesh.rotation.x) * 0.08;
        faceMesh.position.y = Math.sin(Date.now() * 0.0012) * 0.5;

        renderer.render(scene, camera);
    }

    renderLoop();
}

function buildFaceMesh() {
    if (faceMesh) scene.remove(faceMesh);

    geometry = new THREE.PlaneGeometry(80, 80, 127, 127);

    material = new THREE.MeshStandardMaterial({
        map: videoTexture,
        roughness: 0.2,
        metalness: 0.1,
        side: THREE.DoubleSide,
        color: new THREE.Color(currentHexColor)
    });

    if (currentMode === 'classic') {
        faceMesh = new THREE.Mesh(geometry, material);
    } 
    else if (currentMode === 'particles') {
        const pMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(currentHexColor),
            size: 0.75,
            sizeAttenuation: true
        });
        faceMesh = new THREE.Points(geometry, pMaterial);
    } 
    else if (currentMode === 'liquid') {
        const liquidMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color(currentHexColor),
            roughness: 0.05,
            metalness: 0.85,
            wireframe: false
        });
        faceMesh = new THREE.Mesh(geometry, liquidMat);
    }
    else if (currentMode === 'grid') {
        const gridMat = new THREE.MeshStandardMaterial({
            wireframe: true,
            color: new THREE.Color(currentHexColor)
        });
        faceMesh = new THREE.Mesh(geometry, gridMat);
    } 
    else if (currentMode === 'rain') {
        const rainMaterial = new THREE.PointsMaterial({
            color: new THREE.Color(currentHexColor),
            size: 1.1,
            transparent: true,
            opacity: 0.9
        });
        faceMesh = new THREE.Points(geometry, rainMaterial);
    }

    scene.add(faceMesh);
}

function changeStyle(mode, btnElement) {
    currentMode = mode;
    document.querySelectorAll('.fx-btn').forEach(btn => {
        if(btn.id !== 'btn-photo' && btn.id !== 'btn-record') btn.classList.remove('active');
    });
    if(btnElement) btnElement.classList.add('active');
    buildFaceMesh();
}

function changeColor(hex, dotElement) {
    currentHexColor = hex;
    document.querySelectorAll('.color-dot').forEach(dot => dot.classList.remove('active'));
    dotElement.classList.add('active');
    
    document.documentElement.style.setProperty('--primary', hex);
    if (lightLeft) lightLeft.color.set(hex);
    
    buildFaceMesh(); 
}

// עדכון דינמי של עוצמת התלת-ממד מהסליידר
function updateDepthIntensity(val) {
    depthMultiplier = parseFloat(val);
}

// מערכת החלפת שפה דינמית בלייב
function toggleLanguage() {
    currentLang = currentLang === 'he' ? 'en' : 'he';
    document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    const t = translations[currentLang];
    
    document.getElementById('btn-classic').textContent = t.classic;
    document.getElementById('btn-particles').textContent = t.particles;
    document.getElementById('btn-liquid').textContent = t.liquid;
    document.getElementById('btn-grid').textContent = t.grid;
    document.getElementById('btn-rain').textContent = t.rain;
    document.getElementById('btn-photo').textContent = t.photo;
    document.getElementById('btn-record').textContent = isRecording ? t.stopRecord : t.record;
    
    document.getElementById('lbl-color').textContent = t.color;
    document.getElementById('lbl-depth').textContent = t.depth;
    
    const camBtn = document.getElementById('btn-toggle-cam');
    const isCamHidden = camBtn.textContent === translations.he.camHidden || camBtn.textContent === translations.en.camHidden;
    camBtn.textContent = isCamHidden ? t.camHidden : t.camVisible;
}

function startPhotoWorkflow() {
    let count = 4;
    countdownOverlay.style.display = 'block';
    countdownOverlay.textContent = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownOverlay.textContent = count;
        } else {
            clearInterval(interval);
            countdownOverlay.style.display = 'none';
            takeSnapshot();
        }
    }, 1000);
}

function takeSnapshot() {
    renderer.render(scene, camera);
    const dataURL = renderer.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'facegrid_snapshot.png';
    link.href = dataURL;
    link.click();
}

async function toggleVideoRecording(btn) {
    const t = translations[currentLang];
    if (!isRecording) {
        recordedChunks = [];

        // capture canvas video stream
        const canvasStream = renderer.domElement.captureStream(60);

        // create a new stream and add video tracks
        const mixedStream = new MediaStream();
        canvasStream.getVideoTracks().forEach(t => mixedStream.addTrack(t));

        // if the camera stream (video.srcObject) has audio tracks, add them
        if (video.srcObject && typeof video.srcObject.getAudioTracks === 'function') {
            video.srcObject.getAudioTracks().forEach(t => mixedStream.addTrack(t));
        } else {
            // fallback: try to request microphone permission at recording time
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioStream.getAudioTracks().forEach(t => mixedStream.addTrack(t));
            } catch (err) {
                console.warn('No audio stream available or permission denied', err);
            }
        }

        // let browser choose best container/codecs; include opus for audio when possible
        try {
            mediaRecorder = new MediaRecorder(mixedStream, { mimeType: 'video/webm;codecs=vp9,opus' });
        } catch (err) {
            mediaRecorder = new MediaRecorder(mixedStream);
        }

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'facegrid_motion.webm';
            a.click();
        };

        mediaRecorder.start();
        isRecording = true;
        btn.classList.add('recording');
        btn.textContent = t.stopRecord;
    } else {
        mediaRecorder.stop();
        isRecording = false;
        btn.classList.remove('recording');
        btn.textContent = t.record;
    }
}

function toggleCam() {
    const cam = document.getElementById('webcam');
    const btn = document.getElementById('btn-toggle-cam');
    const t = translations[currentLang];
    
    if (cam.style.display === 'none') {
        cam.style.display = 'block';
        btn.textContent = t.camVisible;
    } else {
        cam.style.display = 'none';
        btn.textContent = t.camHidden;
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});