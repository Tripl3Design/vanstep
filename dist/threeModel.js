import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

export let scene, camera, renderer, controls, rgbeLoader;
let groundGeometry, groundMaterial, ground;

const mixers = [];
const clock = new THREE.Clock();
let isStairOut = false;

let doorLeft, doorRight;
let doorAnimation = { value: 0, target: 0, speed: 2 };

export let projectmap = '/projects/vanstep-vanstep/';

let currentLoadId = 0;

export function initThree(containerElem) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd3d3d3);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, containerElem.offsetWidth / containerElem.offsetHeight, 0.1, 1000);
    camera.position.set(-1.6, 0.8, -2.5);
    camera.updateProjectionMatrix();

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerElem.offsetWidth, containerElem.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMappingExposure = 0.5;

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

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-5, 10, -10); // 180 graden gedraaid
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.radius = 10; // Hogere waarde voor zachtere schaduw
    scene.add(directionalLight);

    // OrbitControls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.5;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 + 0.15;
    controls.target.set(0, 0.5, 0);
    controls.minAzimuthAngle = Math.PI / 2;
    controls.maxAzimuthAngle = -Math.PI / 2;
    controls.update();

    // const axesHelper = new THREE.AxesHelper(5);
    // axesHelper.material.depthTest = false;
    // axesHelper.renderOrder = 1;
    // scene.add(axesHelper);

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
//mercedes sprinter
const van_front = projectmap + 'gltf/vans/mercedes_sprinter_new/front.glb';
//H1
const van_H1_back = projectmap + 'gltf/vans/mercedes_sprinter_new/H1_back.glb';
const van_H1_frontroof = projectmap + 'gltf/vans/mercedes_sprinter_new/H1_frontroof.glb';
const van_L1H1_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L1H1_mid.glb';
const van_L2H1_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L2H1_mid.glb';
const van_L3H1_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L3H1_mid.glb';
const van_H1_door_left = projectmap + 'gltf/vans/mercedes_sprinter_new/H1_door_left.glb'; // x:0.902 y:2,781 z:1.341
const van_H1_door_right = projectmap + 'gltf/vans/mercedes_sprinter_new/H1_door_right.glb'; // x:-0.902 y:2,781 z:1,341
//H2
const van_H2_back = projectmap + 'gltf/vans/mercedes_sprinter_new/H2_back.glb';
const van_H2_frontroof = projectmap + 'gltf/vans/mercedes_sprinter_new/H2_frontroof.glb';
const van_L1H2_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L1H2_mid.glb';
const van_L2H2_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L2H2_mid.glb';
const van_L3H2_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L3H2_mid.glb';
const van_H2_door_left = projectmap + 'gltf/vans/mercedes_sprinter_new/H2_door_left.glb'; // x:-0.902 y:2,781 z:1,514
const van_H2_door_right = projectmap + 'gltf/vans/mercedes_sprinter_new/H2_door_right.glb'; // x:-0.902 y:2,781 z:1,514
//H3
const van_H3_back = projectmap + 'gltf/vans/mercedes_sprinter_new/H3_back.glb';
const van_H3_frontroof = projectmap + 'gltf/vans/mercedes_sprinter_new/H3_frontroof.glb';
const van_L1H3_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L1H3_mid.glb';
const van_L2H3_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L2H3_mid.glb';
const van_L3H3_mid = projectmap + 'gltf/vans/mercedes_sprinter_new/L3H3_mid.glb';
//const van_H3_door_left = projectmap + 'gltf/vans/mercedes_sprinter_new/H3_door_left.glb';
//const van_H3_door_right = projectmap + 'gltf/vans/mercedes_sprinter_new/H3_door_right.glb';
//stair
const H1_stair = projectmap + 'gltf/stair/H1_stair.glb';
const H2_stair = projectmap + 'gltf/stair/H2_stair.glb';
//sidebars
const L1_sidebar = projectmap + 'gltf/vans/mercedes_sprinter_new/L1_sidebar.glb';
const L2_sidebar = projectmap + 'gltf/vans/mercedes_sprinter_new/L2_sidebar.glb';
const L3_sidebar = projectmap + 'gltf/vans/mercedes_sprinter_new/L3_sidebar.glb';
//sunvisor
const van_sunvisor = projectmap + 'gltf/vans/mercedes_sprinter_new/sunvisor.glb';
const van_sunvisor_light = projectmap + 'gltf/vans/mercedes_sprinter_new/sunvisor_light.glb';
//vanstep
const vanstep_url = projectmap + 'gltf/vanstep/vanstep.gltf';
const vanstep_light_url = projectmap + 'gltf/vanstep/vanstep_light.gltf';
const vanstep_towbar_url = projectmap + 'gltf/vanstep/vanstep_towbar.gltf';
const vanstep_lightAndTowbar_url = projectmap + 'gltf/vanstep/vanstep_lightAndTowbar.gltf';
const vanstep_towbarAttachement_url = projectmap + 'gltf/vanstep/vanstep_towbarAttachement.glb';
const vanstep_lighting_url = projectmap + 'gltf/vanstep/lighting.glb';
const vanstep_bolts_url = projectmap + 'gltf/vanstep/vanstep_bolts.glb';
const vanstep_beam_url = projectmap + 'gltf/vanstep/vanstep_beam.glb';
const vanstep_logo_url = projectmap + 'gltf/vanstep/vanstep_logo.gltf';

const vanstep_towbar_standard = projectmap + 'gltf/vanstep/vanstep_towbar_standard.glb';
const vanstep_towbar_catchJaw = projectmap + 'gltf/vanstep/vanstep_towbar_catchJaw.glb';
const vanstep_towbar_variobloc = projectmap + 'gltf/vanstep/vanstep_towbar_variobloc.glb';

const van_parts = [van_front, van_sunvisor, van_H1_back, van_L1H1_mid, van_L2H1_mid, van_L3H1_mid, van_H1_door_left, van_H1_door_right, van_H1_frontroof, van_H2_back, van_H2_frontroof, van_L1H2_mid, van_L2H2_mid, van_L3H2_mid, van_H2_door_left, van_H2_door_right, van_H3_back, van_H3_frontroof, van_L1H3_mid, van_L2H3_mid, van_L3H3_mid];
const sidebar_parts = [L1_sidebar, L2_sidebar, L3_sidebar];

function loadAndTransformModel(
    url,
    transforms = [{}],
    group,
    modelData,
    name
) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        const textureLoader = new THREE.TextureLoader();

        loader.load(url, function (gltf) {
            let loadedModel = gltf.scene;

            if (url !== vanstep_url && url !== vanstep_bolts_url && url !== vanstep_logo_url && url !== vanstep_beam_url && url !== vanstep_lighting_url && !van_parts.includes(url) && !sidebar_parts.includes(url) && url !== H1_stair && url !== H2_stair) {
                const box = new THREE.Box3().setFromObject(loadedModel);
                const center = box.getCenter(new THREE.Vector3());
                loadedModel.position.sub(center);
            }

            const applyMaterial = (child) => {
                return new Promise((materialResolve) => {
                    if (!child.isMesh) {
                        materialResolve();
                        return;
                    }
                    const vanstepColor = (modelData.vanstep && modelData.vanstep.color) ? (modelData.vanstep.color.color || modelData.vanstep.color) : null;
                    if (url === vanstep_url || url === vanstep_towbar_url || url === vanstep_light_url || url === vanstep_lightAndTowbar_url) {


                        if (child.isMesh) {
                            if (child.geometry.index) {
                                child.geometry = child.geometry.toNonIndexed();
                            }
                            child.geometry.computeVertexNormals();

                            const pos = child.geometry.attributes.position;
                            const norm = child.geometry.attributes.normal;
                            const uvs = new Float32Array(pos.count * 2);
                            const n = new THREE.Vector3();

                            for (let i = 0; i < pos.count; i += 3) {
                                n.set(0, 0, 0);
                                for (let j = 0; j < 3; j++) {
                                    n.x += norm.getX(i + j);
                                    n.y += norm.getY(i + j);
                                    n.z += norm.getZ(i + j);
                                }
                                n.normalize();

                                const ax = Math.abs(n.x);
                                const ay = Math.abs(n.y);
                                const az = Math.abs(n.z);
                                const scale = 0.001;

                                if (ay > ax && ay > az) {
                                    for (let j = 0; j < 3; j++) {
                                        uvs[(i + j) * 2] = pos.getX(i + j) * scale;
                                        uvs[(i + j) * 2 + 1] = pos.getZ(i + j) * scale;
                                    }
                                } else if (ax > ay && ax > az) {
                                    for (let j = 0; j < 3; j++) {
                                        uvs[(i + j) * 2] = pos.getY(i + j) * scale;
                                        uvs[(i + j) * 2 + 1] = pos.getZ(i + j) * scale;
                                    }
                                } else {
                                    for (let j = 0; j < 3; j++) {
                                        uvs[(i + j) * 2] = pos.getX(i + j) * scale;
                                        uvs[(i + j) * 2 + 1] = pos.getY(i + j) * scale;
                                    }
                                }
                            }
                            child.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
                        }

                        if (child.material && (child.material.name === 'diamondplateBack')) {
                            child.material = new THREE.MeshStandardMaterial({
                                color: 0x1a1a1a, // Effen donkere kleur
                                roughness: 0.8,
                                metalness: 0.2
                            });
                            child.castShadow = true;
                            child.receiveShadow = true;
                            materialResolve();
                            return;
                        }

                        const texturePath = projectmap + 'gltf/vanstep/textures/diamond_plate/';
                        const loadTexture = (name, isColor = false) => {
                            const tex = textureLoader.load(texturePath + name);
                            tex.wrapS = THREE.RepeatWrapping;
                            tex.wrapT = THREE.RepeatWrapping;
                            if (isColor) tex.colorSpace = THREE.SRGBColorSpace;
                            tex.repeat.set(7.5, 7.5);
                            return tex;
                        };

                        let baseColorMap;
                        if (vanstepColor === 'blank') {
                            baseColorMap = 'diamond_plate_basecolor_blank.jpg';
                        } else if (vanstepColor === 'black') {
                            baseColorMap = 'diamond_plate_basecolor_black.jpg';
                        } else if (vanstepColor === 'blackSanded') {
                            baseColorMap = 'diamond_plate_basecolor_blackSanded.jpg';
                        }

                        child.material = new THREE.MeshStandardMaterial({
                            map: loadTexture(baseColorMap, true),
                            normalMap: loadTexture('diamond_plate_normal.jpg'),
                            normalScale: new THREE.Vector2(5, 5),
                            roughnessMap: loadTexture('diamond_plate_roughness.jpg'),
                            metalnessMap: loadTexture('diamond_plate_metallic.jpg'),
                            metalness: 1,
                            roughness: 1,
                        });
                        materialResolve();
                    } else if (url === vanstep_logo_url) {
                        child.geometry.computeBoundingBox();
                        const { min, max } = child.geometry.boundingBox;
                        const size = new THREE.Vector3();
                        child.geometry.boundingBox.getSize(size);
                        const pos = child.geometry.attributes.position;
                        const uvs = new Float32Array(pos.count * 2);

                        for (let i = 0; i < pos.count; i++) {
                            uvs[i * 2] = (max.x - pos.getX(i)) / size.x;
                            uvs[i * 2 + 1] = (max.z - pos.getZ(i)) / size.z;
                        }
                        child.geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

                        let logoTexture;
                        if (vanstepColor === 'blank') {
                            logoTexture = textureLoader.load(projectmap + 'gltf/vanstep/textures/vanstep_logo.png');
                        } else {
                            logoTexture = textureLoader.load(projectmap + 'gltf/vanstep/textures/vanstep_logo_black.jpg');
                        }
                        logoTexture.colorSpace = THREE.SRGBColorSpace;
                        logoTexture.flipY = false;

                        child.material = new THREE.MeshBasicMaterial({
                            map: logoTexture,
                            transparent: true,
                            side: THREE.DoubleSide
                        });
                        materialResolve();
                    } else if (url === vanstep_lighting_url) {
                        if (child.isMesh && child.material && child.material.name === 'lighting_lamp') {
                            child.material.emissive = new THREE.Color(0xffffff);
                            child.material.emissiveIntensity = 1;
                            child.material.color.set(0xffffff);
                            child.material.toneMapped = false;
                        }
                        materialResolve();

                    } else if (sidebar_parts.includes(url)) {
                        let material;
                        if (modelData.sidebars && modelData.sidebars.color === 'chrome') {
                            // Chroom materiaal
                            material = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.95, roughness: 0.1 });
                        } else {
                            // Zwart materiaal (standaard)
                            material = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8, roughness: 0.6 });
                        }
                        child.material = material;
                        materialResolve();
                    } else if (van_parts.includes(url)) {
                        if (child.material && child.material.name === 'body' && modelData.van.color) {
                            child.material = new THREE.MeshPhysicalMaterial({
                                color: new THREE.Color('#' + modelData.van.color),
                                metalness: 0.8,
                                roughness: 0.5,
                                envMapIntensity: 1.0,
                                clearcoat: 1.0,
                                clearcoatRoughness: 0.1
                            });
                        } else if (child.material) {
                            // Voor andere onderdelen (ramen, banden etc.) behoud het originele materiaal
                        }
                        materialResolve();
                    } else {
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
                const newMixers = [];
                transforms.forEach(transform => {
                    const mesh = loadedModel.clone();
                    mesh.position.copy(transform.position || new THREE.Vector3());
                    mesh.rotation.copy(transform.rotation || new THREE.Euler(0, 0, 0));
                    mesh.scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
                    if (name) {
                        mesh.name = name;
                        mesh.baseRotation = mesh.rotation.clone();
                    }
                    group.add(mesh);

                    if (gltf.animations && gltf.animations.length > 0) {
                        const mixer = new THREE.AnimationMixer(mesh);
                        mixer.existingActions = [];
                        gltf.animations.forEach((clip) => {
                            const action = mixer.clipAction(clip);
                            action.setLoop(THREE.LoopOnce);
                            action.clampWhenFinished = true;
                            mixer.existingActions.push(action);
                        });
                        newMixers.push(mixer);
                    }
                });
                resolve(newMixers);
            });
        }, undefined, function (error) {
            reject(error);
        });
    });
}

function createLicensePlate(vanData, group, position, rotation, name) {
    return new Promise((resolve, reject) => {
        const fontLoader = new FontLoader();
        const countryCode = vanData.country || 'nl';
        let fontUrl;

        if (countryCode === 'de') {
            fontUrl = projectmap + `gltf/vans/textures/LicensePlateDE.json`;
        } else { // Default to 'nl'
            fontUrl = projectmap + `gltf/vans/textures/LicensePlateNL.json`;
        }

        const createPlateWithFont = (font) => {
            // 1. Maak de achtergrondplaat (geel) met ratio 52x11
            const plateWidth = 0.52;
            const plateHeight = 0.11;
            const plateDepth = 0.005; // Dikte van de kentekenplaat
            const plateGeometry = new THREE.BoxGeometry(plateWidth, plateHeight, plateDepth);

            const textureLoader = new THREE.TextureLoader();
            const plateTexture = textureLoader.load(projectmap + `gltf/vans/textures/licensePlate_${countryCode}.jpg`);
            plateTexture.colorSpace = THREE.SRGBColorSpace;

            const plateMaterial = new THREE.MeshStandardMaterial({
                map: plateTexture,
                metalness: 0.1,
                roughness: 0.5
            });
            const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
            plateMesh.receiveShadow = true;

            // 2. Maak de 3D tekst
            const textGeometry = new TextGeometry(vanData.licensePlate, {
                font: font,
                size: 0.052,
                depth: 0.002,
                curveSegments: 4,
            });
            textGeometry.computeBoundingBox();
            const textMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const textMesh = new THREE.Mesh(textGeometry, textMaterial);

            // 3. Centreer de tekst op de plaat
            const textWidth = textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x;
            textMesh.position.x = -textWidth / 2;
            if (countryCode === 'de') {
                textMesh.position.y = -0.02;
            } else {
                textMesh.position.y = -0.032;
            }
            textMesh.position.z = plateDepth / 2;
            textMesh.castShadow = true;

            // 4. Groepeer plaat en tekst
            const licensePlateGroup = new THREE.Group();
            if (name) licensePlateGroup.name = name;
            licensePlateGroup.add(plateMesh);
            licensePlateGroup.add(textMesh);

            // 5. Positioneer en roteer de kentekenplaat
            licensePlateGroup.position.copy(position);
            licensePlateGroup.rotation.copy(rotation);
            group.add(licensePlateGroup);
            resolve([]);
        };

        fontLoader.load(fontUrl, createPlateWithFont, undefined, (error) => {
            console.warn(`Kon het lettertype ${fontUrl} niet laden. Fallback naar standaard lettertype.`, error);
            const fallbackFontUrl = 'https://cdn.jsdelivr.net/npm/three@v0.163.0/examples/fonts/helvetiker_bold.typeface.json';
            fontLoader.load(fallbackFontUrl, createPlateWithFont, undefined, (fallbackError) => {
                console.error('Kon ook het fallback lettertype niet laden:', fallbackError);
                reject(fallbackError);
            });
        });
    });
}


const models = [];

export async function loadModelData(modelData) {
    const myLoadId = ++currentLoadId;

    const group = new THREE.Group();

    let loadPromises = [];

    let mid_url;
    let back_url;
    let frontroof_url;
    let door_left_url;
    let door_right_url;
    let offset_pos;

    let door_left_pos;
    let door_right_pos;


    const vanLength = modelData.van?.length || modelData.van?.lenght;
    const vanHeight = modelData.van?.height;

    const len = vanLength.toUpperCase();
    const height = vanHeight.toUpperCase();

    if (height === 'H2') {
        back_url = van_H2_back;
        frontroof_url = van_H2_frontroof;
        door_left_url = van_H2_door_left;
        door_right_url = van_H2_door_right;



        if (len === 'L1') { mid_url = van_L1H2_mid; offset_pos = 0; }
        else if (len === 'L3') { mid_url = van_L3H2_mid; offset_pos = 1.7; }
        else { mid_url = van_L2H2_mid; offset_pos = 0.665; }
    } else if (height === 'H3') {
        back_url = van_H3_back;
        frontroof_url = van_H3_frontroof;
        door_left_url = van_H2_door_left;
        door_right_url = van_H2_door_right;

        if (len === 'L1') { mid_url = van_L1H3_mid; offset_pos = 0; }
        else if (len === 'L3') { mid_url = van_L3H3_mid; offset_pos = 1.7; }
        else { mid_url = van_L2H3_mid; offset_pos = 0.665; }
    } else {
        // H1
        back_url = van_H1_back;
        frontroof_url = van_H1_frontroof;
        door_left_url = van_H1_door_left;
        door_right_url = van_H1_door_right;

        if (len === 'L1') { mid_url = van_L1H1_mid; offset_pos = 0; }
        else if (len === 'L3') { mid_url = van_L3H1_mid; offset_pos = 1.7; }
        else { mid_url = van_L2H1_mid; offset_pos = 0.665; }
    }

    const front_pos = offset_pos;

    // Verschuiving om de achterkant van de bus op 0,0,0 te krijgen.
    // Pas dit getal aan tot de achterbumper precies op 0 staat.
    const van_z_offset = 2.8;

    let door_left_rotation = new THREE.Euler(0, 0, 0);
    if ([van_H1_door_left, van_H2_door_left].includes(door_left_url)) {
        door_left_rotation = new THREE.Euler(0, 0, 0);
    }
    let door_right_rotation = new THREE.Euler(0, 0, 0);
    if ([van_H1_door_right, van_H2_door_right].includes(door_right_url)) {
        door_right_rotation = new THREE.Euler(0, 0, 0);
    }

    if (modelData.van.height === 'H1') {
        door_left_pos = new THREE.Vector3(0.902, 1.341, 0);
        door_right_pos = new THREE.Vector3(-0.902, 1.341, 0);
    } else {
        door_left_pos = new THREE.Vector3(0.902, 1.514, 0);
        door_right_pos = new THREE.Vector3(-0.902, 1.514, 0);
    }

    // Altijd het basismodel van de bus laden
    loadPromises.push(loadAndTransformModel(van_front, [{ position: new THREE.Vector3(0, 0, front_pos + van_z_offset) }], group, modelData));
    loadPromises.push(loadAndTransformModel(frontroof_url, [{ position: new THREE.Vector3(0, 0, front_pos + van_z_offset) }], group, modelData));
    loadPromises.push(loadAndTransformModel(back_url, [{ position: new THREE.Vector3(0, 0, 0 + van_z_offset) }], group, modelData));
    loadPromises.push(loadAndTransformModel(door_left_url, [{ position: door_left_pos, rotation: door_left_rotation }], group, modelData, 'doorLeft'));
    loadPromises.push(loadAndTransformModel(door_right_url, [{ position: door_right_pos, rotation: door_right_rotation }], group, modelData, 'doorRight'));
    loadPromises.push(loadAndTransformModel(mid_url, [{ position: new THREE.Vector3(0, 0, front_pos + van_z_offset) }], group, modelData));

    // Laad conditioneel de accessoires op basis van de modelData

    if (modelData.vanstep) {
        const vanstepPos = [{ position: new THREE.Vector3(0, 0.38, 0) }];
        const { towbar, lights } = modelData.vanstep;

        let mainVanstepUrl = vanstep_url; // Default
        if (towbar && lights) {
            mainVanstepUrl = vanstep_lightAndTowbar_url;
        } else if (towbar) {
            mainVanstepUrl = vanstep_towbar_url;
        } else if (lights) {
            mainVanstepUrl = vanstep_light_url;

        }
        loadPromises.push(loadAndTransformModel(mainVanstepUrl, vanstepPos, group, modelData));

        if (towbar) {
            loadPromises.push(loadAndTransformModel(vanstep_towbarAttachement_url, vanstepPos, group, modelData));

            let couplingPos = vanstepPos;
            if (towbar.variobloc) {
                loadPromises.push(loadAndTransformModel(vanstep_towbar_variobloc, vanstepPos, group, modelData));
                couplingPos = [{ position: new THREE.Vector3(0, 0.38, -0.016) }];
            }

            if (towbar.type === 'standard') {
                loadPromises.push(loadAndTransformModel(vanstep_towbar_standard, couplingPos, group, modelData));
            } else if (towbar.type === 'catchJaw') {
                loadPromises.push(loadAndTransformModel(vanstep_towbar_catchJaw, couplingPos, group, modelData));
            }
        } if (lights) {
            loadPromises.push(loadAndTransformModel(vanstep_lighting_url, vanstepPos, group, modelData));
        }

        // Common parts that are always loaded with a vanstep
        loadPromises.push(
            loadAndTransformModel(vanstep_bolts_url, vanstepPos, group, modelData),
            loadAndTransformModel(vanstep_logo_url, vanstepPos, group, modelData),
            loadAndTransformModel(vanstep_beam_url, vanstepPos, group, modelData)
        );
    }

    if (modelData.sidebars) {
        let sidebar_url = L2_sidebar; // Default naar L2
        const vanLength = modelData.van?.length || modelData.van?.lenght;
        if (vanLength) {
            const len = vanLength.toUpperCase();
            if (len === 'L1') sidebar_url = L1_sidebar;
            if (len === 'L2') sidebar_url = L2_sidebar;
            if (len === 'L3') sidebar_url = L3_sidebar;
        }
        loadPromises.push(loadAndTransformModel(sidebar_url, [{ position: new THREE.Vector3(0, 0, front_pos + van_z_offset) }], group, modelData));
    }

    if (modelData.stair && height !== 'H3') {
        let stair_url = H1_stair;
        let stair_pos = new THREE.Vector3(-0.5, 0.43, .1);
        if (modelData.stair.height === 'H2') {
            stair_url = H2_stair;
            stair_pos = new THREE.Vector3(-0.1, 0.53, .1);
        }
        loadPromises.push(loadAndTransformModel(stair_url, [{ position: stair_pos }], group, modelData));
    }
    if (modelData.sunvisor) {
        console.log("Loading accessory: sunvisor");
        // Laad altijd de basis zonneklep
        loadPromises.push(loadAndTransformModel(van_sunvisor, [{ position: new THREE.Vector3(0, 0, front_pos + van_z_offset) }], group, modelData));
        if (modelData.sunvisor.lights) {
            // Laad de verlichting als extra model als dit is gekozen
            loadPromises.push(loadAndTransformModel(van_sunvisor_light, [{ position: new THREE.Vector3(0, 0, front_pos + van_z_offset) }], group, modelData));
        }
    }

    // Laad het kenteken als dit is opgegeven in het model
    if (modelData.van && modelData.van.licensePlate) {
        // Kentekenplaat achterkant
        const backPlatePos = new THREE.Vector3(.34, .66, 0.008);
        const backPlateRot = new THREE.Euler(0, Math.PI, 0); // 180 graden draaien om de Y-as
        loadPromises.push(createLicensePlate(modelData.van, group, backPlatePos, backPlateRot, 'licensePlateBack'));

        // Kentekenplaat voorkant
        //const front_z = (offset_pos + van_z_offset) + 0.5; // Geschatte offset voor de bumper
        //const frontPlatePos = new THREE.Vector3(0, 0.6, front_z);
        //const frontPlateRot = new THREE.Euler(0, 0, 0); // Geen rotatie nodig voor de voorkant
        //loadPromises.push(createLicensePlate(modelData.van.licensePlate, group, frontPlatePos, frontPlateRot));
    }

    try {
        const results = await Promise.all(loadPromises);

        if (myLoadId !== currentLoadId) return;

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
        mixers.length = 0;
        isStairOut = false;

        doorLeft = group.getObjectByName('doorLeft');
        doorRight = group.getObjectByName('doorRight');

        const licensePlateBack = group.getObjectByName('licensePlateBack');
        if (doorLeft && licensePlateBack) {
            doorLeft.attach(licensePlateBack);
        }

        doorAnimation.value = 0;
        doorAnimation.target = 0;

        results.flat().forEach(mixer => mixers.push(mixer));

        scene.add(group);
        models.push(group);
    } catch (error) {
        console.error("Error loading models:", error);
    }
}

function render() {
    renderer.setAnimationLoop((timestamp, frame) => {
        const delta = clock.getDelta();
        mixers.forEach(mixer => mixer.update(delta));
        updateDoors(delta);
        controls.update();
        renderer.render(scene, camera); // Deze regel ontbrak en is essentieel om de scène te tekenen.
    });
}

function updateDoors(delta) {
    if (doorAnimation.value !== doorAnimation.target) {
        doorAnimation.value = THREE.MathUtils.lerp(doorAnimation.value, doorAnimation.target, doorAnimation.speed * delta);

        if (Math.abs(doorAnimation.value - doorAnimation.target) < 0.001) {
            doorAnimation.value = doorAnimation.target;
        }

        const mapRange = (val, a, b) => THREE.MathUtils.clamp((val - a) / (b - a), 0, 1);
        const leftVal = mapRange(doorAnimation.value, 0.3, 1.0);
        const rightVal = mapRange(doorAnimation.value, 0, 1.0);

        if (doorLeft) doorLeft.rotation.y = doorLeft.baseRotation.y - (leftVal * Math.PI / 2);
        if (doorRight) doorRight.rotation.y = doorRight.baseRotation.y + (rightVal * Math.PI / 2);
    }
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

export function setCameraTarget(x, y, z) {
    if (controls) {
        controls.target.set(x, y, z);
    }
}

export function setCameraZoomRange(min, max) {
    if (controls) {
        controls.minDistance = min;
        controls.maxDistance = max;
    }
}

export function setCameraRotationLimit(min, max) {
    if (controls) {
        controls.minAzimuthAngle = min;
        controls.maxAzimuthAngle = max;
        controls.update(); // Forceer de controls om de nieuwe limieten toe te passen
    }
}

export function toggleDoors() {
    const targetDoorState = doorAnimation.target === 0 ? 1 : 0;

    if (targetDoorState === 0 && isStairOut) {
        toggleAnimations();
        setTimeout(() => {
            doorAnimation.target = 0;
        }, 1000);
    } else {
        doorAnimation.target = targetDoorState;
    }
}

export function toggleAnimations() {
    const targetStairState = !isStairOut;

    const runAnimation = (state) => {
        isStairOut = state;
        mixers.forEach(mixer => {
            if (mixer.existingActions) {
                mixer.existingActions.forEach(action => {
                    action.paused = false;
                    action.stop();
                    if (isStairOut) {
                        action.timeScale = 1;
                        action.reset();
                        action.play();
                    } else {
                        action.timeScale = -1;
                        action.reset();
                        action.time = action.getClip().duration;
                        action.play();
                    }
                });
            }
        });
    };

    // Als we gaan uitklappen (target is true) EN de deuren zijn dicht (target is 0)
    if (targetStairState && doorAnimation.target === 0) {
        toggleDoors(); // Open de deuren
        setTimeout(() => {
            runAnimation(true);
        }, 800); // Wacht 800ms tot deuren ver genoeg open zijn
    } else {
        runAnimation(targetStairState);
    }
}