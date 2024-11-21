import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Pad naar je bestand in Firebase Storage (gebruik het bestandspad zonder gs://)
const modelPath = 'https://firebasestorage.googleapis.com/v0/b/vanwoerdenwonen-tripletise.appspot.com/o/glbModels%2Ftestmodel.glb?alt=media';

// Verkrijg de downloadbare URL van het bestand

getDownloadURL(ref(storage, modelPath))
  .then((url) => {
    // Gebruik de verkregen URL om het model te laden
    loadModel(url);
  })
  .catch((error) => {
    console.error('Er is een fout opgetreden bij het ophalen van de bestand-URL:', error);
  });

  let container;
  let camera, scene, renderer;
  let controller;
  let reticle;
  let loadedModel = null;
  
  let hitTestSource = null;
  let hitTestSourceRequested = false;  // Make sure this is initialized

init();

function init() {
    container = document.createElement('div');
    document.body.appendChild(container);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 3);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    const customButtonContainer = document.getElementById('viewInAr');
    customButtonContainer.appendChild(ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

    controller = renderer.xr.getController(0);
    scene.add(controller);

    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(- Math.PI / 2),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then(function (referenceSpace) {
                session.requestHitTestSource({ space: referenceSpace }).then(function (source) {
                    hitTestSource = source;
                });
            });

            session.addEventListener('end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;
            });

            hitTestSourceRequested = true;  // Update the flag here after request
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }
    }

    renderer.render(scene, camera);
}

function loadModel(url) {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
        loadedModel = gltf.scene;
        console.log('Model succesvol geladen:', loadedModel);
        // Voeg het model toe aan de scene
        scene.add(loadedModel);
    }, undefined, (error) => {
        console.error('Er is een fout opgetreden bij het laden van het model:', error);
    });
}