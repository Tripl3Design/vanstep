import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export let scene, camera, renderer, controls, rgbeLoader;
let groundGeometry, groundMaterial, ground;

export let projectmap = '/projects/vanstep-vanstep/';

export function initThree(containerElem) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd3d3d3);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, containerElem.offsetWidth / containerElem.offsetHeight, 0.1, 100);
    camera.position.set(-4, 1.7, 4);
    camera.updateProjectionMatrix();

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerElem.offsetWidth, containerElem.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;

    containerElem.appendChild(renderer.domElement);

    const resizeObserver = new ResizeObserver(() => {
        onWindowResize(containerElem, camera, renderer);
    });

    resizeObserver.observe(modelviewer);

    rgbeLoader = new RGBELoader();
    rgbeLoader.load(projectmap + 'img/hdri/studio_small_08_1k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = texture;
    });

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Terug naar lagere intensiteit
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-5, 10, -10); // 180 graden gedraaid
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.radius = 8; // Hogere waarde voor zachtere schaduw
    scene.add(directionalLight);

    // OrbitControls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.target.set(0, 0.5, 0);
    controls.update();

    addGround();

    // desktop version
    if (windowHeight < windowWidth) {
        const fullscreenButton = document.getElementById('fullscreen');
        if (fullscreenButton) {
            fullscreenButton.addEventListener('click', fullscreenToggle);
        } else {
            console.warn("Element with ID 'fullscreen' not found. Fullscreen functionality might be unavailable.");
        }
    }

    render();
}

function addGround() {
    groundGeometry = new THREE.PlaneGeometry(20, 20);
    groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);
}

const van_url = projectmap + 'gltf/van.gltf';
const vanstep_url = projectmap + 'gltf/vanstep.gltf';
const sidebar_url = projectmap + 'gltf/sidebar.gltf';

function loadAndTransformModel(
    url,
    transforms = [{}],
    group
) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();

        loader.load(url, function (gltf) {
            let loadedModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = box.getCenter(new THREE.Vector3());
            loadedModel.position.sub(center);

            const applyMaterial = (child) => {
                return new Promise((materialResolve) => {
                    if (!child.isMesh) {
                        materialResolve();
                        return;
                    }

                    if (url === vanstep_url) {
                        const texturePath = projectmap + 'gltf/textures/albedo_staal.png';
                        textureLoader.load(
                            texturePath,
                            (texture) => { // onLoad
                                texture.flipY = false;
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    map: texture,
                                    metalness: 0.8,
                                    roughness: 0.5
                                });
                                child.material = newMaterial;
                                materialResolve();
                            },
                            undefined, // onProgress
                            (error) => { // onError
                                console.error('Fout bij het laden van de textuur:', texturePath, error);
                                child.material = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Maak rood bij fout
                                materialResolve(); // Toch resolven om de app niet te breken
                            }
                        );
                    } else if (url === sidebar_url) {
                        child.material = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.6 });
                        materialResolve();
                    } else {
                        child.material = new THREE.MeshStandardMaterial({ color: 0xd3d3d3, metalness: 0.0, roughness: 1.0 });
                        materialResolve();
                    }

                    child.castShadow = true;
                    child.receiveShadow = true;
                });
            };

            const materialPromises = [];
            loadedModel.traverse((child) => {
                materialPromises.push(applyMaterial(child));
            });

            Promise.all(materialPromises).then(() => {
                transforms.forEach(transform => {
                    const mesh = loadedModel.clone();
                    mesh.position.copy(transform.position || new THREE.Vector3());
                    mesh.rotation.copy(transform.rotation || new THREE.Euler(0, 0, 0));
                    mesh.scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
                    group.add(mesh);
                });
                resolve();
            });
        }, undefined, function (error) {
            reject(error);
        });
    });
}


const models = [];

export async function loadModelData(modelData) {
    models.forEach(modelGroup => {
        if (scene.children.includes(modelGroup)) {
            scene.remove(modelGroup);
            modelGroup.traverse(child => {
                if (child.isMesh) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        child.material.dispose();
                    }
                }
            });
        }
    });

    models.length = 0;

    const group = new THREE.Group();

    let loadPromises = [];

    // Altijd het basismodel van de bus laden
    loadPromises.push(loadAndTransformModel(van_url, [{}], group));

    // Laad conditioneel de accessoires op basis van de modelData
    if (modelData.vanstep) {
        console.log("Loading accessory: vanstep");
        loadPromises.push(loadAndTransformModel(vanstep_url, [{}], group));
    }
    if (modelData.sidebars) {
        console.log("Loading accessory: sidebar");
        loadPromises.push(loadAndTransformModel(sidebar_url, [{}], group));
    }   /*
    if (modelData.stair) {
        console.log("Loading accessory: stair");
        const url = projectmap + 'gltf/stair.gltf';
        loadPromises.push(loadAndTransformModel(url, [{}], group));
    }
    if (modelData.sunvisor) {
        console.log("Loading accessory: sunvisor");
        const url = projectmap + 'gltf/sunvisor.gltf';
        loadPromises.push(loadAndTransformModel(url, [{}], group));
    }
*/
    try {
        await Promise.all(loadPromises);
        scene.add(group);
        models.push(group);
    } catch (error) {
        console.error("Error loading models:", error);
    }
}

function render() {
    renderer.setAnimationLoop((timestamp, frame) => {
        controls.update();
        renderer.render(scene, camera);
    });
}

function onWindowResize(container, camera, renderer) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    renderer.setPixelRatio(window.devicePixelRatio || 1);
}

export function fullscreenToggle() {
    var controlpanelCol = document.getElementById('controlpanelCol');
    var modelviewerCol = document.getElementById('modelviewerCol');

    if (controlpanelCol.classList.contains('d-none')) {
        modelviewerCol.classList.add('col-md-6');
        modelviewerCol.style.width = '50%';
        controlpanelCol.classList.remove('d-none');
        document.getElementById('fullscreen').innerHTML = '<span class="material-symbols-outlined m-0 p-1">open_in_full</span>';
    } else {
        modelviewerCol.classList.remove('col-md-6');
        modelviewerCol.style.width = '100%';
        controlpanelCol.classList.add('d-none');
        document.getElementById('fullscreen').innerHTML = '<span class="material-symbols-outlined m-0 p-1">close_fullscreen</span>';
    }

    const newWidth = modelviewerCol.offsetWidth;
    const newHeight = modelviewerCol.offsetHeight;

    renderer.setSize(newWidth, newHeight);

    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
}

function dataURLToBlob(dataURL) {
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

    const arrayBuffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        arrayBuffer[i] = byteString.charCodeAt(i);
    }

    return new Blob([arrayBuffer], { type: mimeString });
}

export function captureScreenshot() {
    renderer.render(scene, camera);

    const originalCanvas = renderer.domElement;
    const originalWidth = originalCanvas.width;
    const originalHeight = originalCanvas.height;

    const size = Math.min(originalWidth, originalHeight);
    const squareCanvas = document.createElement('canvas');
    squareCanvas.width = size;
    squareCanvas.height = size;
    const context = squareCanvas.getContext('2d');

    const offsetX = (originalWidth - size) / 2;
    const offsetY = (originalHeight - size) / 2;

    context.drawImage(originalCanvas, offsetX, offsetY, size, size, 0, 0, size, size);

    const dataURL = squareCanvas.toDataURL('image/png');
    const blob = dataURLToBlob(dataURL);

    return { dataURL, blob };
}
