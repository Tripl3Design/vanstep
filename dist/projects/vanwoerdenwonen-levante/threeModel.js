import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

let scene, camera, renderer, rgbeLoader, ambientLight, controls;
let groundGeometry, groundMaterial, ground

let projectmap = 'projects/vanwoerdenwonen-levante/';

export function initThree(containerElem) {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd3d3d3);

    // Camera setup
    camera = new THREE.PerspectiveCamera(60, containerElem.offsetWidth / containerElem.offsetHeight, 1, 100);
    camera.position.set(-7, 5, 10);
    camera.fov = 40;
    camera.updateProjectionMatrix();

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerElem.offsetWidth, containerElem.offsetHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    // Append renderer to the container element
    containerElem.appendChild(renderer.domElement);

    const resizeObserver = new ResizeObserver(() => {
        onWindowResize(containerElem, camera, renderer);
    });

    resizeObserver.observe(modelviewer);
    /*
        // Add window resize event listener
        window.addEventListener('resize', () => {
            onWindowResize(containerElem, camera, renderer);
        });
    
        if(modelviewer.style.height changed){
            onWindowResize(containerElem, camera, renderer);
        }
    */
    // Environment setup, lights, etc...
    rgbeLoader = new RGBELoader();
    rgbeLoader.load(projectmap + 'img/hdri/yoga_room_2k.hdr', function (texture) {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = texture.clone();
        const exposure = 0.5;
        scene.environment = envMap;
        renderer.toneMappingExposure = exposure;
    });

    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffcc00, 1);
    directionalLight.position.set(5, 20, 5);
    directionalLight.target.position.set(0, 0, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    scene.add(directionalLight);

    // Additional Spotlight
    const spotlight = new THREE.SpotLight(0xff0000, 0.5);
    spotlight.position.set(-10, 10, 10);
    spotlight.angle = Math.PI / 6;
    spotlight.decay = 2; // Vervaging van lichtsterkte
    spotlight.target.position.set(0, 0, 0);
    scene.add(spotlight);
    scene.add(spotlight.target);

    // OrbitControls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    // mobile version
    if (windowHeight > windowWidth) {
        controls.dampingFactor = 0.1; // Iets hogere demping voor mobiel
        controls.minDistance = 1; // Minder restrictief op mobiel
    }
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.update();

    // Ground plane setup
    groundGeometry = new THREE.PlaneGeometry(20, 20);
    groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Start the render loop
    render();

    // desktop version
    if (windowHeight < windowWidth) {
        document.getElementById('fullscreen').addEventListener('click', fullscreenToggle);
    }
}

export function fullscreenToggle() {
    var controlpanelCol = document.getElementById('controlpanelCol');
    var modelviewerCol = document.getElementById('modelviewerCol');

    if (controlpanelCol.classList.contains('d-none')) {
        // Show control panel and shrink model viewer to 50%
        modelviewerCol.classList.add('col-md-6');
        modelviewerCol.style.width = '50%';
        controlpanelCol.classList.remove('d-none');
        document.getElementById('fullscreen').innerHTML = '<span class="material-symbols-outlined m-0 p-1">open_in_full</span>';
    } else {
        // Hide control panel and make model viewer full width
        modelviewerCol.classList.remove('col-md-6');
        modelviewerCol.style.width = '100%';
        controlpanelCol.classList.add('d-none');
        document.getElementById('fullscreen').innerHTML = '<span class="material-symbols-outlined m-0 p-1">close_fullscreen</span>';
    }

    // Get new dimensions of the modelviewerCol
    const newWidth = modelviewerCol.offsetWidth;
    const newHeight = modelviewerCol.offsetHeight;

    // Resize the Three.js renderer
    renderer.setSize(newWidth, newHeight);

    // Update the camera aspect ratio and projection matrix
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
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
    return dataURL;
}

export function exportModel() {
    const exporter = new GLTFExporter();

    exporter.parse(
        scene,
        function (result) {
            let blob;
            if (result instanceof ArrayBuffer) {
                blob = new Blob([result], { type: 'model/gltf-binary' });
            } else {
                const json = JSON.stringify(result);
                blob = new Blob([json], { type: 'application/json' });
            }

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'model.glb';
            link.click();

            URL.revokeObjectURL(link.href);
        },
        { binary: true }
    );
}

// desktop version
if (windowHeight < windowWidth) {
    document.getElementById('downloadModel').addEventListener('click', () => {
        exportModel();
    });
}

export function viewAr() {
    const exporter = new GLTFExporter();

    exporter.parse(
        scene,  // Zorg ervoor dat dit de juiste scene is
        function (result) {
            let blob;
            let url;

            if (result instanceof ArrayBuffer) {
                blob = new Blob([result], { type: 'model/gltf-binary' });
            } else {
                const json = JSON.stringify(result);
                blob = new Blob([json], { type: 'application/json' });
            }

            // Maak een URL voor de blob
            url = URL.createObjectURL(blob);
            updateModelViewer(url);

            // Maak het model zichtbaar en activeer AR
            const modelViewer = document.querySelector('ar-viewer');
            modelViewer.style.display = 'block';

            // Activeer AR na het instellen van het model
            if (modelViewer.canActivateAR) {
                modelViewer.activateAR().then(() => {
                    console.log("AR mode activated.");
                }).catch((error) => {
                    console.error("Failed to activate AR:", error);
                });
            } else {
                console.error("AR is not supported on this device.");
            }

            // Voeg een listener toe om de URL te revoken na het laden
            modelViewer.addEventListener('load', () => {
                URL.revokeObjectURL(url);
            }, { once: true });

        },
        (error) => {
            console.error("Error exporting GLTF: ", error);
        },
        { binary: true }
    );
}

function updateModelViewer(modelUrl) {
    const modelViewer = document.querySelector('ar-viewer');
    if (modelViewer) {  // Check of de model viewer bestaat
        modelViewer.src = modelUrl;  // Update model-viewer met de dynamische blob URL
    } else {
        console.error("Model viewer element not found.");
    }
}
/*
if (windowHeight > windowWidth) {
    document.getElementById('viewAr').addEventListener('click', () => {
        viewAr();
    });
}
*/
const levante_sofa_25Url = projectmap + 'gltf/levante_sofa_25.gltf';
const levante_footstoolUrl = projectmap + 'gltf/levante_footstool.gltf';

const levante_leg_corner_rightUrl = projectmap + 'gltf/levante_leg_corner_right.gltf';
const levante_leg_corner_middleUrl = projectmap + 'gltf/levante_leg_corner_middle.gltf';
const levante_leg_corner_leftUrl = projectmap + 'gltf/levante_leg_corner_left.gltf';
const levante_s_maleUrl = projectmap + 'gltf/levante_s_male.gltf';
const levante_s_femaleUrl = projectmap + 'gltf/levante_s_female.gltf';
const levante_m_maleUrl = projectmap + 'gltf/levante_m_male.gltf';
const levante_m_femaleUrl = projectmap + 'gltf/levante_m_female.gltf';
const levante_l_maleUrl = projectmap + 'gltf/levante_l_male.gltf';
const levante_l_femaleUrl = projectmap + 'gltf/levante_l_female.gltf';


function createPBRMaterial(hexColor, materialType) {
    const textureLoader = new THREE.TextureLoader();
    let material
    if (materialType == 'boucle') {
        const baseColor = projectmap + 'img/textures/boucle/boucle_BaseColor.jpg';
        const displacement = projectmap + 'img/textures/boucle/boucle_Displacement.tiff';
        const metallic = projectmap + 'img/textures/boucle/boucle_Metallic.jpg';
        const normal = projectmap + 'img/textures/boucle/boucle_Normal.png';
        const roughness = projectmap + 'img/textures/boucle/boucle_Roughness.jpg';

        const baseColorTexture = textureLoader.load(baseColor);
        baseColorTexture.wrapS = THREE.RepeatWrapping; // Zorgt ervoor dat de texture herhaald wordt in de X-richting
        baseColorTexture.wrapT = THREE.RepeatWrapping; // Zorgt ervoor dat de texture herhaald wordt in de Y-richting
        baseColorTexture.repeat.set(3, 3); // Texture 3 keer herhalen in zowel de X- als Y-richting

        const displacementTexture = textureLoader.load(displacement);
        displacementTexture.wrapS = THREE.RepeatWrapping; // Zorgt ervoor dat de texture herhaald wordt in de X-richting
        displacementTexture.wrapT = THREE.RepeatWrapping; // Zorgt ervoor dat de texture herhaald wordt in de Y-richting
        displacementTexture.repeat.set(3, 3); // Texture 3 keer herhalen in zowel de X- als Y-richting

        const normalTexture = textureLoader.load(normal);
        normalTexture.wrapS = THREE.RepeatWrapping; // Zorgt ervoor dat de texture herhaald wordt in de X-richting
        normalTexture.wrapT = THREE.RepeatWrapping; // Zorgt ervoor dat de texture herhaald wordt in de Y-richting
        normalTexture.repeat.set(3, 3); // Texture 3 keer herhalen in zowel de X- als Y-richting

        material = new THREE.MeshPhysicalMaterial({
            //map: baseColorTexture,
            color: new THREE.Color('#' + hexColor),
            metalness: 0.1,
            roughness: 0.9,
            normalMap: normalTexture,
            //normalScale: new THREE.Vector2(.1, .1), // Normal map schaling
            roughnessMap: textureLoader.load(roughness),
            metalnessMap: textureLoader.load(metallic),
            displacementMap: displacementTexture,
            displacementScale: 0.3,
        });

        return material;
    } else if (materialType == 'paint') {
        material = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#' + hexColor),
            roughness: 0.6,
            metalness: 0.6
        });
        return material;
    }

}

function loadAndTransformModel(url, transforms = [{}], group, hexColor, materialType, hexColor_duotone = null, materialTypeDuotone = null) {
    const loader = new GLTFLoader();

    loader.load(url, function (gltf) {
        const threeModel = gltf.scene;

        threeModel.traverse((child) => {
            if (child.isMesh) {
                if (!child.geometry.attributes.uv) {
                    console.warn('Model heeft geen UV-coördinaten voor dit child: ', child);
                }
                if (hexColor_duotone && child.material.name === "duotone") {
                    child.material = createPBRMaterial(hexColor_duotone, materialTypeDuotone);
                } else {
                    child.material = createPBRMaterial(hexColor, materialType);
                }
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        if (!transforms || !transforms.length) transforms = [{}];
        transforms.forEach(transform => {
            const mesh = threeModel.clone();
            mesh.position.copy(transform.position || new THREE.Vector3());
            mesh.scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
            mesh.rotation.copy(transform.rotation || new THREE.Euler(0, 0, 0));
            group.add(mesh);
        });
    });
}


const models = [];

export async function loadModelData(model) {
    // Remove old models from the scene
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

    if (model.type == "art2502") {
        const group = new THREE.Group();

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
        ];

        if (model.upholsteryDuotone != null) {
            loadAndTransformModel(levante_sofa_25Url, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
        } else {
            loadAndTransformModel(levante_sofa_25Url, elementTransforms, group, model.upholstery.hexColor);
        }
        
        scene.add(group);
        models.push(group);
    } else if (model.type == "art3002") {
        const group = new THREE.Group();

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
        ];

        loadAndTransformModel(levante_sofa_3Url, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');

        scene.add(group);
        models.push(group);
    } else if (model.type == "art6093" || model.type == "art6091") {
        const group = new THREE.Group();

        let elementTransforms;
        if (model.type == "art6093") {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        loadAndTransformModel(levante_recamiere_3Url, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');

        scene.add(group);
        models.push(group);
    } else if (model.type == "art9085110") {
        const group = new THREE.Group();

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
        ];

        loadAndTransformModel(levante_footstoolUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');

        scene.add(group);
        models.push(group);
    } else if (model.type == "art5310" || model.type == "art5314") {
        const group = new THREE.Group();

        let legTransforms;
        if (model.type == "art5310") {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        loadAndTransformModel(levante_leg_corner_rightUrl, legTransforms, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransforms, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransforms, group, '000000', 'paint');

        let elementTransforms;
        if (model.type == "art5310") {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        if (model.upholsteryDuotone != null) {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
            loadAndTransformModel(levante_s_femaleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
        } else {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, model.upholstery.hexColor);
            loadAndTransformModel(levante_s_femaleUrl, elementTransforms, group, model.upholstery.hexColor);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art5311" || model.type == "art5316") {
        const group = new THREE.Group();

        let legTransformsRight;
        if (model.type == "art5311") {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.35), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.35), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        let legTransformsMiddle;
        if (model.type == "art5311") {
            legTransformsMiddle = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsMiddle = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        let legTransformsLeft;
        if (model.type == "art5311") {
            legTransformsLeft = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsLeft = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        loadAndTransformModel(levante_leg_corner_rightUrl, legTransformsRight, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransformsMiddle, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransformsLeft, group, '000000', 'paint');

        let elementTransforms;
        if (model.type == "art5311") {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        if (model.upholsteryDuotone != null) {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
        } else {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, model.upholstery.hexColor);
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, model.upholstery.hexColor);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art5312" || model.type == "art5315") {
        const group = new THREE.Group();

        let legTransformsRight;
        if (model.type == "art5312") {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.25), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.25), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        let legTransformsMiddle;
        if (model.type == "art5312") {
            legTransformsMiddle = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsMiddle = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        let legTransformsLeft;
        if (model.type == "art5312") {
            legTransformsLeft = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.25), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsLeft = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.25), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        
        loadAndTransformModel(levante_leg_corner_rightUrl, legTransformsRight, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransformsMiddle, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransformsLeft, group, '000000', 'paint');

        let elementTransforms;
        if (model.type == "art5312") {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        if (model.upholsteryDuotone != null) {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
            loadAndTransformModel(levante_m_femaleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
        } else {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, model.upholstery.hexColor);
            loadAndTransformModel(levante_m_femaleUrl, elementTransforms, group, model.upholstery.hexColor);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art5313" || model.type == "art5317") {
        const group = new THREE.Group();

        let legTransformsRight;
        if (model.type == "art5313") {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.25), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.25), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        let legTransformsMiddle;
        if (model.type == "art5313") {
            legTransformsMiddle = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsMiddle = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        let legTransformsLeft;
        if (model.type == "art5313") {
            legTransformsLeft = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsLeft = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        
        loadAndTransformModel(levante_leg_corner_rightUrl, legTransformsRight, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransformsMiddle, group, '000000', 'paint');
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransformsLeft, group, '000000', 'paint');


        let elementTransforms;
        if (model.type == "art5313") {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        if (model.upholsteryDuotone != null) {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
        } else {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, model.upholstery.hexColor);
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, model.upholstery.hexColor);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art846" || model.type == "art553") {
        const group = new THREE.Group();

        let elementTransforms;
        if (model.type == "art846") {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        if (model.upholsteryDuotone != null) {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
        } else {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, model.upholstery.hexColor);
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, model.upholstery.hexColor);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art598" || model.type == "art860") {
        const group = new THREE.Group();

        let elementTransforms;
        if (model.type == "art598") {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }
        if (model.upholsteryDuotone != null) {
            loadAndTransformModel(levante_l_maleUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, model.upholstery.hexColor, 'boucle', model.upholsteryDuotone.hexColor, 'boucle');
        } else {
            loadAndTransformModel(levante_l_maleUrl, elementTransforms, group, model.upholstery.hexColor);
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, model.upholstery.hexColor);
        }
        scene.add(group);
        models.push(group);
    }
}


function render() {
    requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
}

function onWindowResize(container, camera, renderer) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    // Optioneel: Schaal de rendering voor high-DPI schermen
    renderer.setPixelRatio(window.devicePixelRatio || 1);
}