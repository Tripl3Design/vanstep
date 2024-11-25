import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

let scene, camera, renderer, controls, rgbeLoader;
let groundGeometry, groundMaterial, ground;

let projectmap = 'projects/vanwoerdenwonen-levante/';

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
    renderer.toneMappingExposure = 1;

    containerElem.appendChild(renderer.domElement);

    const resizeObserver = new ResizeObserver(() => {
        onWindowResize(containerElem, camera, renderer);
    });

    resizeObserver.observe(modelviewer);

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
    scene.add(directionalLight);

    // OrbitControls setup
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
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

    // desktop version
    if (windowHeight < windowWidth) {
        document.getElementById('fullscreen').addEventListener('click', fullscreenToggle);
    }

    // Start the render loop
    render();
}

// Desktop versie
if (windowHeight < windowWidth) {
    document.getElementById('downloadModel').addEventListener('click', () => {
        exportModel();
    });
}

const levante_sofa_25Url = projectmap + 'gltf/levante_sofa_25.gltf';
const levante_sofa_3Url = projectmap + 'gltf/levante_sofa_3.gltf';
const levante_longchairUrl = projectmap + 'gltf/levante_longchair.gltf';
const levante_leg_longchairUrl = projectmap + 'gltf/levante_leg_longchair.gltf';
const levante_legs_sofaUrl = projectmap + 'gltf/levante_legs_sofa.gltf';
const levante_leg_corner_rightUrl = projectmap + 'gltf/levante_leg_corner_right.gltf';
const levante_leg_corner_middleUrl = projectmap + 'gltf/levante_leg_corner_middle.gltf';
const levante_leg_corner_leftUrl = projectmap + 'gltf/levante_leg_corner_left.gltf';
const levante_s_maleUrl = projectmap + 'gltf/levante_s_male.gltf';
const levante_s_femaleUrl = projectmap + 'gltf/levante_s_female.gltf';
const levante_m_maleUrl = projectmap + 'gltf/levante_m_male.gltf';
const levante_m_femaleUrl = projectmap + 'gltf/levante_m_female.gltf';
const levante_l_maleUrl = projectmap + 'gltf/levante_l_male.gltf';
const levante_l_femaleUrl = projectmap + 'gltf/levante_l_female.gltf';
const levante_recamiereUrl = projectmap + 'gltf/levante_recamiere.gltf';
const levante_footstoolUrl = projectmap + 'gltf/levante_footstool.gltf';
const levante_legs_footstoolUrl = projectmap + 'gltf/levante_legs_footstool.gltf';

const textureCache = {}; // Cache voor opgeslagen textures

function loadTexture(path) {
    if (textureCache[path]) {
        return textureCache[path]; // Haal texture uit cache
    } else {
        const texture = new THREE.TextureLoader().load(path);
        textureCache[path] = texture; // Sla texture op in cache
        return texture;
    }
}

function createPBRMaterial(materialType, hexColor = null, texturePath = null) {
    let material;

    // Gebruik een standaard kleur als hexColor null is
    const color = hexColor ? new THREE.Color(`#${hexColor}`) : new THREE.Color(0xffffff);

    if (materialType === 'boucle') {
        const metallic = `${projectmap}gltf/boucle_Metallic.jpg`;
        const normal = `${projectmap}gltf/boucle_Normal.png`;
        const roughness = `${projectmap}gltf/boucle_Roughness.jpg`;

        const scaledTexturePath = texturePath ? loadTexture(texturePath) : null;
        if (scaledTexturePath) {
            scaledTexturePath.wrapS = scaledTexturePath.wrapT = THREE.RepeatWrapping;
            scaledTexturePath.repeat.set(5, 5);
        }

        const normalTexture = loadTexture(normal);
        normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping;
        normalTexture.repeat.set(4, 4);

        material = new THREE.MeshPhysicalMaterial({
            map: scaledTexturePath,
            color: color,
            metalness: 0.1,
            roughness: 0.9,
            normalMap: normalTexture,
            roughnessMap: loadTexture(roughness),
            metalnessMap: loadTexture(metallic)
        });
    } else if (materialType === 'velvet') {
        const scaledTexturePath = texturePath ? loadTexture(texturePath) : null;
        if (scaledTexturePath) {
            scaledTexturePath.wrapS = scaledTexturePath.wrapT = THREE.RepeatWrapping;
            scaledTexturePath.repeat.set(.9, .9);
        }
        material = new THREE.MeshPhysicalMaterial({
            map: scaledTexturePath,
            color: color,
            metalness: 0.0,
            roughness: 0.5,
            clearcoat: 1,
            clearcoatRoughness: .9
        });
    } else if (materialType === 'paint') {
        material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.1,
            metalness: 0.9,
        });
    }
    return material;
}

// Functie om AR-model te exporteren
function exportArModel() {
    // Hier wachten we 300ms (of afhankelijk van je applicatie kan dit korter/langer zijn) voordat we de grond toevoegen
    setTimeout(() => {
        // Zorg ervoor dat exportModel() wordt uitgevoerd
        exportModel();

        // Voeg de grond toe voor AR
        addGroundForAR();

    }, 300);
}

// Functie om de grond toe te voegen voor AR-weergave
function addGroundForAR() {
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    
    scene.add(ground);
}

// Functie om model te laden en te transformeren
function loadAndTransformModel(
    url,
    transforms = [{}],
    group,
    hexColor = null,
    texturePath = null,
    materialType,
    hexColor_duotone = null,
    texturePath_duotone = null,
    materialTypeDuotone = null
) {
    const loader = new GLTFLoader();

    loader.load(url, function (gltf) {
        let loadedModel = gltf.scene;

        // Center the model in the scene
        const box = new THREE.Box3().setFromObject(loadedModel);
        const center = box.getCenter(new THREE.Vector3());
        loadedModel.position.sub(center); // Center the model at (0, 0, 0)

        // Apply materials to the model
        loadedModel.traverse((child) => {
            if (child.isMesh) {
                if (child.material) {
                    child.material.dispose();
                }

                // Apply the duotone or regular material
                if (texturePath_duotone && child.material.name === "duotone") {
                    child.material = createPBRMaterial(materialTypeDuotone, hexColor_duotone, texturePath_duotone);
                } else {
                    child.material = createPBRMaterial(materialType, hexColor, texturePath);
                }

                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Apply transformations (position, scale, rotation) and handle mirroring if needed
        transforms.forEach(transform => {
            const mesh = loadedModel.clone();
            
            // Apply position, rotation, and scale
            mesh.position.copy(transform.position || new THREE.Vector3());
            mesh.rotation.copy(transform.rotation || new THREE.Euler(0, 0, 0));
            mesh.scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));

            // If mirror is true, flip the X axis (or apply other axis flips as necessary)
            if (transform.mirror) {
                mesh.scale.x = -Math.abs(mesh.scale.x); // Flip the X axis for mirroring
            }

            // Add the transformed mesh to the group
            group.add(mesh);
        });

        exportArModel();

        // Make the model visible
        loadedModel.visible = true;
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

        let legTransforms;

        legTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
        ];

        loadAndTransformModel(levante_legs_sofaUrl, legTransforms, group, '000000', null, 'paint', null, null, null);

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
        ];

        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_sofa_25Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_sofa_25Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art3002") {
        const group = new THREE.Group();

        let legTransforms;

        legTransforms = [
            { position: new THREE.Vector3(0.2, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            { position: new THREE.Vector3(-0.2, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
        ];

        loadAndTransformModel(levante_legs_sofaUrl, legTransforms, group, '000000', null, 'paint', null, null, null);

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
        ];

        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_sofa_3Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_sofa_3Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art6093" || model.type == "art6091") {
        const group = new THREE.Group();

        let legTransforms;

        legTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
        ];

        loadAndTransformModel(levante_legs_sofaUrl, legTransforms, group, '000000', null, 'paint', null, null, null);

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
        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_recamiereUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_recamiereUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
        }

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

        loadAndTransformModel(levante_leg_corner_rightUrl, legTransforms, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransforms, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransforms, group, '000000', null, 'paint', null, null, null);

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
        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
            loadAndTransformModel(levante_s_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
            loadAndTransformModel(levante_s_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
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

        loadAndTransformModel(levante_leg_corner_rightUrl, legTransformsRight, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransformsMiddle, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransformsLeft, group, '000000', null, 'paint', null, null, null);

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
        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art5312" || model.type == "art5315") {
        const group = new THREE.Group();

        let legTransformsRight;
        if (model.type == "art5312") {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.2), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsRight = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.2), scale: new THREE.Vector3(-1, 1, 1) },
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
                { position: new THREE.Vector3(-0.15, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else {
            legTransformsLeft = [
                { position: new THREE.Vector3(0.15, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        }

        loadAndTransformModel(levante_leg_corner_rightUrl, legTransformsRight, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransformsMiddle, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransformsLeft, group, '000000', null, 'paint', null, null, null);

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
        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
            loadAndTransformModel(levante_m_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
            loadAndTransformModel(levante_m_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
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

        loadAndTransformModel(levante_leg_corner_rightUrl, legTransformsRight, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_middleUrl, legTransformsMiddle, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransformsLeft, group, '000000', null, 'paint', null, null, null);

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
        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_m_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
            loadAndTransformModel(levante_l_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
        }

        scene.add(group);
        models.push(group);
    } else if (model.type == "art846" || model.type == "art553") {
        const group = new THREE.Group();

        let legTransforms;
        if (model.type = "art846") {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ]
        }
        else {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },

            ];
        }
        loadAndTransformModel(levante_leg_corner_leftUrl, legTransforms, group, '000000', null, 'paint', null, null, null);
        loadAndTransformModel(levante_leg_longchairUrl, legTransforms, group, '000000', null, 'paint', null, null, null);

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
        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
        }
        scene.add(group);
        models.push(group);
    } else if (model.type == "art598" || model.type == "art860") {
        const group = new THREE.Group();

        let legTransforms;
        if (model.type = "art598") {
            legTransforms = [
                { position: new THREE.Vector3(-0.25, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
            loadAndTransformModel(levante_leg_corner_leftUrl, legTransforms, group, '000000', null, 'paint', null, null, null);
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
            loadAndTransformModel(levante_leg_longchairUrl, legTransforms, group, '000000', null, 'paint', null, null, null);

        }
        else {
            legTransforms = [
                { position: new THREE.Vector3(-0.25, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
            loadAndTransformModel(levante_leg_corner_leftUrl, legTransforms, group, '000000', null, 'paint', null, null, null);
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
            loadAndTransformModel(levante_leg_longchairUrl, legTransforms, group, '000000', null, 'paint', null, null, null);
        }

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
        if (model.upholsteryDuotone) {
            loadAndTransformModel(levante_l_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure);
        } else {
            loadAndTransformModel(levante_l_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
            loadAndTransformModel(levante_longchairUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);
        }
        scene.add(group);
        models.push(group);
    }
    if (model.footstool == true) {
        const group = new THREE.Group();

        let legTransforms;
        if (model.type == 'art2502' || model.type == 'art3002' || model.type == 'art846' || model.type == 'art553' || model.type == 'art598' || model.type == 'art860' || model.type == 'art6093' || model.type == 'art9091') {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else if (model.type == 'art5314' || model.type == 'art5316' || model.type == 'art5315' || model.type == 'art5317') {
            legTransforms = [
                { position: new THREE.Vector3(.6, (model.seatHeight == 47 ? 0.03 : 0), .6), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        } else if (model.type == 'art6091') {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(-45), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        } else {
            legTransforms = [
                { position: new THREE.Vector3(-0.5, (model.seatHeight == 47 ? 0.03 : 0), 0.5), scale: new THREE.Vector3(1, 1, 1) },
            ];
        }
        loadAndTransformModel(levante_legs_footstoolUrl, legTransforms, group, '000000', null, 'paint', null, null, null);

        let elementTransforms;
        if (model.type == 'art2502' || model.type == 'art3002' || model.type == 'art846' || model.type == 'art553' || model.type == 'art598' || model.type == 'art860' || model.type == 'art6093' || model.type == 'art9091') {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0), scale: new THREE.Vector3(1, 1, 1) },
            ];
        } else if (model.type == 'art5314' || model.type == 'art5316' || model.type == 'art5315' || model.type == 'art5317') {
            elementTransforms = [
                { position: new THREE.Vector3(.6, (model.seatHeight == 47 ? 0.03 : 0), .6), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(0), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        } else if (model.type == 'art6091') {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(-45), 0), scale: new THREE.Vector3(-1, 1, 1) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(-0.5, (model.seatHeight == 47 ? 0.03 : 0), 0.5), scale: new THREE.Vector3(1, 1, 1) },
            ];
        }
        loadAndTransformModel(levante_footstoolUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null);

        scene.add(group);
        models.push(group);
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

    // Optioneel: Schaal de rendering voor high-DPI schermen
    renderer.setPixelRatio(window.devicePixelRatio || 1);
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

function dataURLToBlob(dataURL) {
    // Split the data URL into its parts
    const byteString = atob(dataURL.split(',')[1]);
    const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];

    // Create a Uint8Array to hold the binary data
    const arrayBuffer = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
        arrayBuffer[i] = byteString.charCodeAt(i);
    }

    // Create a Blob from the binary data
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

    // Convert the canvas content to a data URL
    const dataURL = squareCanvas.toDataURL('image/png');

    // Convert the data URL to a Blob
    const blob = dataURLToBlob(dataURL);

    // Return both the dataURL and the Blob
    return { dataURL, blob };
}

if (windowHeight > windowWidth) {
    document.getElementById("arButton").addEventListener("click", () => {
        if (modelDownloadURL) {
            const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(modelDownloadURL)}&mode=ar_only&resizable=false&disable_occlusion=true#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=https://developers.google.com/ar;end;`;
            window.location.href = intentUrl;
        } else {
            console.error('Model URL niet beschikbaar. Zorg ervoor dat het model eerst is geëxporteerd.');
        }
    });
}

let modelDownloadURL = null; // Hier slaan we de download-URL op

function exportModel() {
    const exporter = new GLTFExporter();
    const options = {
        binary: true,                // Exporteer als een binair GLB-bestand
        embedImages: true,          // Zorg ervoor dat afbeeldingen worden ingesloten
        includeCustomExtensions: true // Zorgt ervoor dat extensies zoals clearcoat worden meegenomen
    };

    // Verwijder tijdelijke objecten uit de scène (zoals de grond)
    scene.remove(ground);

    exporter.parse(
        scene,
        function (result) {
            const blob = new Blob([result], { type: 'model/gltf-binary' });

            // Upload het bestand naar Firebase Storage
            const storageRef = ref(storage, 'glbModels/model.glb');
            uploadBytes(storageRef, blob).then(() => {
                console.log('Model succesvol geüpload!');

                // Verkrijg de downloadbare URL
                getDownloadURL(storageRef).then((url) => {
                    console.log('Model URL:', url);
                    modelDownloadURL = url; // Sla de URL op voor later gebruik
                });
            }).catch((error) => {
                console.error('Fout bij uploaden naar Firebase:', error);
            });
        },
        (error) => {
            console.error('Fout bij exporteren:', error);
        },
        options
    );
}

// Helperfunctie om GLB-data te combineren
function combineGLBData(jsonBuffer, binaryData) {
    const headerBuffer = new ArrayBuffer(12);
    const headerView = new DataView(headerBuffer);
    headerView.setUint32(0, 0x46546C67, true);
    headerView.setUint32(4, 2, true);

    const jsonChunkLength = jsonBuffer.byteLength;
    const binaryChunkLength = binaryData ? binaryData.byteLength : 0;
    const totalLength = 12 + 8 + jsonChunkLength + (binaryChunkLength ? 8 + binaryChunkLength : 0);

    headerView.setUint32(8, totalLength, true);

    const jsonChunkHeader = new ArrayBuffer(8);
    const jsonChunkView = new DataView(jsonChunkHeader);
    jsonChunkView.setUint32(0, jsonChunkLength, true);
    jsonChunkView.setUint32(4, 0x4E4F534A, true);

    let binaryChunkHeader = null;
    if (binaryData) {
        binaryChunkHeader = new ArrayBuffer(8);
        const binaryChunkView = new DataView(binaryChunkHeader);
        binaryChunkView.setUint32(0, binaryChunkLength, true);
        binaryChunkView.setUint32(4, 0x004E4942, true);
    }

    const glbData = new Uint8Array(totalLength);
    let offset = 0;
    glbData.set(new Uint8Array(headerBuffer), offset);
    offset += headerBuffer.byteLength;
    glbData.set(new Uint8Array(jsonChunkHeader), offset);
    offset += jsonChunkHeader.byteLength;
    glbData.set(new Uint8Array(jsonBuffer), offset);
    offset += jsonChunkLength;

    if (binaryData) {
        glbData.set(new Uint8Array(binaryChunkHeader), offset);
        offset += binaryChunkHeader.byteLength;
        glbData.set(new Uint8Array(binaryData), offset);
    }

    return glbData;
}