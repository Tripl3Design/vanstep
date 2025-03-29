
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';

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
    directionalLight.shadow.mapSize.width = 2048;  // Standaard is 512, verhoog voor scherpere schaduwen
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.radius = 2;  // Verklein voor scherpere schaduwen (0 = hard, hoger = zachter)
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

    // Ground plane setup
    addGround();

    // desktop version
    if (windowHeight < windowWidth) {
        document.getElementById('fullscreen').addEventListener('click', fullscreenToggle);
    }

    // Start the render loop
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

// Desktop versie
if (windowHeight < windowWidth) {
    document.getElementById('downloadModel').addEventListener('click', () => {
        exportModel();
    });
}

const levante_sofa_25Url = projectmap + 'gltf/levante_sofa_25.gltf';
const levante_sofa_3Url = projectmap + 'gltf/levante_sofa_3.gltf';

const levante_longchairUrl = projectmap + 'gltf/levante_longchair.gltf';
const levante_longchair_mirrorUrl = projectmap + 'gltf/levante_longchair_mirror.gltf';

const levante_leg_longchairUrl = projectmap + 'gltf/levante_leg_longchair.gltf';
const levante_leg_longchair_mirrorUrl = projectmap + 'gltf/levante_leg_longchair_mirror.gltf';

const levante_legs_sofa_25Url = projectmap + 'gltf/levante_legs_sofa_25.gltf';
const levante_legs_sofa_3Url = projectmap + 'gltf/levante_legs_sofa_3.gltf';

const levante_leg_corner_rightUrl = projectmap + 'gltf/levante_leg_corner_right.gltf';
const levante_leg_corner_right_mirrorUrl = projectmap + 'gltf/levante_leg_corner_right_mirror.gltf';

const levante_leg_corner_middleUrl = projectmap + 'gltf/levante_leg_corner_middle.gltf';
const levante_leg_corner_middle_mirrorUrl = projectmap + 'gltf/levante_leg_corner_middle_mirror.gltf';

const levante_leg_corner_leftUrl = projectmap + 'gltf/levante_leg_corner_left.gltf';
const levante_leg_corner_left_mirrorUrl = projectmap + 'gltf/levante_leg_corner_left_mirror.gltf';

const levante_s_maleUrl = projectmap + 'gltf/levante_s_male.gltf';
const levante_s_male_mirrorUrl = projectmap + 'gltf/levante_s_male_mirror.gltf';

const levante_s_femaleUrl = projectmap + 'gltf/levante_s_female.gltf';
const levante_s_female_mirrorUrl = projectmap + 'gltf/levante_s_female_mirror.gltf';

const levante_m_maleUrl = projectmap + 'gltf/levante_m_male.gltf';
const levante_m_male_mirrorUrl = projectmap + 'gltf/levante_m_male_mirror.gltf';

const levante_m_femaleUrl = projectmap + 'gltf/levante_m_female.gltf';
const levante_m_female_mirrorUrl = projectmap + 'gltf/levante_m_female_mirror.gltf';

const levante_l_maleUrl = projectmap + 'gltf/levante_l_male.gltf';
const levante_l_male_mirrorUrl = projectmap + 'gltf/levante_l_male_mirror.gltf';

const levante_l_femaleUrl = projectmap + 'gltf/levante_l_female.gltf';
const levante_l_female_mirrorUrl = projectmap + 'gltf/levante_l_female_mirror.gltf';

const levante_recamiereUrl = projectmap + 'gltf/levante_recamiere.gltf';
const levante_recamiere_mirrorUrl = projectmap + 'gltf/levante_recamiere_mirror.gltf';

const levante_footstoolUrl = projectmap + 'gltf/levante_footstool.gltf';
const levante_footstool_mirrorUrl = projectmap + 'gltf/levante_footstool_mirror.gltf';

const levante_legs_footstoolUrl = projectmap + 'gltf/levante_legs_footstool.gltf';
const levante_legs_footstool_mirrorUrl = projectmap + 'gltf/levante_legs_footstool_mirror.gltf';

const textureCache = {}; // Cache voor opgeslagen textures

function loadTexture(path) {
    if (textureCache[path]) {
        return textureCache[path];
    } else {
        const texture = new THREE.TextureLoader().load(path);
        textureCache[path] = texture;
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
    return new Promise((resolve, reject) => {
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

                    // Verwijderd: Opacity aanpassing en transparantie
                }
            });

            // Apply transformations and add to group
            transforms.forEach(transform => {
                const mesh = loadedModel.clone();
                mesh.position.copy(transform.position || new THREE.Vector3());
                mesh.rotation.copy(transform.rotation || new THREE.Euler(0, 0, 0));
                mesh.scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
                group.add(mesh);
            });

            loadedModel.visible = true;

            resolve(); // Resolve the promise when loading is complete
        }, undefined, function (error) {
            reject(error); // Reject the promise if there's an error
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

    const group = new THREE.Group();

    let loadPromises = [];

    if (model.type == "art2502") {
        let legTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) }
        ];

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0)) }
        ];

        // Load the leg model
        loadPromises.push(loadAndTransformModel(levante_legs_sofa_25Url, legTransforms, group, '000000', null, 'paint', null, null, null));

        // Load the upholstery model, handling the duotone condition
        if (model.upholsteryDuotone) {
            loadPromises.push(loadAndTransformModel(levante_sofa_25Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure));
        } else {
            loadPromises.push(loadAndTransformModel(levante_sofa_25Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null));
        }
    } else if (model.type == "art3002") {


        let legTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) }
        ];

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) }
        ];


        // Laad de poten (legs)
        loadPromises.push(
            loadAndTransformModel(levante_legs_sofa_3Url, legTransforms, group, '000000', null, 'paint', null, null, null)
        );

        // Laad de bekleding (upholstery)
        if (model.upholsteryDuotone) {
            loadPromises.push(
                loadAndTransformModel(levante_sofa_3Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
            );
        } else {
            loadPromises.push(
                loadAndTransformModel(levante_sofa_3Url, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
            );
        }

        // Wacht tot ALLE modellen geladen zijn voordat ze aan de scene worden toegevoegd


    } else if (model.type == "art6093" || model.type == "art6091") {


        let legTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) }
        ];

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) }
        ];

        // Laad de poten (legs)
        loadPromises.push(
            loadAndTransformModel(levante_legs_sofa_25Url, legTransforms, group, '000000', null, 'paint', null, null, null)
        );

        // Controleer het type model en laad de juiste bekleding (upholstery)
        if (model.type == "art6093") {
            if (model.upholsteryDuotone) {
                loadPromises.push(
                    loadAndTransformModel(levante_recamiereUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
                );
            } else {
                loadPromises.push(
                    loadAndTransformModel(levante_recamiereUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
                );
            }
        } else {
            if (model.upholsteryDuotone) {
                loadPromises.push(
                    loadAndTransformModel(levante_recamiere_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
                );
            } else {
                loadPromises.push(
                    loadAndTransformModel(levante_recamiere_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
                );
            }
        }

        // Wacht tot ALLE modellen geladen zijn voordat ze aan de scene worden toegevoegd



    } else if (model.type == "art5310" || model.type == "art5314") {


        let legTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) }
        ];

        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) }
        ];

        // Laden van de poten (legs)
        if (model.type == "art5310") {
            loadPromises.push(
                loadAndTransformModel(levante_leg_corner_rightUrl, legTransforms, group, '000000', null, 'paint', null, null, null),
                loadAndTransformModel(levante_leg_corner_middleUrl, legTransforms, group, '000000', null, 'paint', null, null, null),
                loadAndTransformModel(levante_leg_corner_leftUrl, legTransforms, group, '000000', null, 'paint', null, null, null)
            );
        } else {
            loadPromises.push(
                loadAndTransformModel(levante_leg_corner_right_mirrorUrl, legTransforms, group, '000000', null, 'paint', null, null, null),
                loadAndTransformModel(levante_leg_corner_middle_mirrorUrl, legTransforms, group, '000000', null, 'paint', null, null, null),
                loadAndTransformModel(levante_leg_corner_left_mirrorUrl, legTransforms, group, '000000', null, 'paint', null, null, null)
            );
        }

        // Laden van de bekleding (upholstery)
        if (model.type == "art5310") {
            if (model.upholsteryDuotone) {
                loadPromises.push(
                    loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                    loadAndTransformModel(levante_s_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
                );
            } else {
                loadPromises.push(
                    loadAndTransformModel(levante_s_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null),
                    loadAndTransformModel(levante_s_femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
                );
            }
        } else {
            if (model.upholsteryDuotone) {
                loadPromises.push(
                    loadAndTransformModel(levante_s_male_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                    loadAndTransformModel(levante_s_female_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
                );
            } else {
                loadPromises.push(
                    loadAndTransformModel(levante_s_male_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null),
                    loadAndTransformModel(levante_s_female_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
                );
            }
        }


    } else if (model.type == "art5311" || model.type == "art5316") {


        let legTransformsRight = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.35) },
        ];
        let legTransformsMiddle = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];
        let legTransformsLeft = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];
        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];

        // Kies de juiste URL's afhankelijk van het model type
        const legRightUrl = model.type == "art5311" ? levante_leg_corner_rightUrl : levante_leg_corner_right_mirrorUrl;
        const legMiddleUrl = model.type == "art5311" ? levante_leg_corner_middleUrl : levante_leg_corner_middle_mirrorUrl;
        const legLeftUrl = model.type == "art5311" ? levante_leg_corner_leftUrl : levante_leg_corner_left_mirrorUrl;
        const maleUrl = model.type == "art5311" ? levante_s_maleUrl : levante_s_male_mirrorUrl;
        const femaleUrl = model.type == "art5311" ? levante_l_femaleUrl : levante_l_female_mirrorUrl;

        // Maak een array van promises voor het laden van alle modellen
        loadPromises = [
            loadAndTransformModel(legRightUrl, legTransformsRight, group, '000000', null, 'paint'),
            loadAndTransformModel(legMiddleUrl, legTransformsMiddle, group, '000000', null, 'paint'),
            loadAndTransformModel(legLeftUrl, legTransformsLeft, group, '000000', null, 'paint')
        ];

        // Voeg de stoffering modellen toe als duotone aanwezig is
        if (model.upholsteryDuotone) {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
            );
        } else {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure)
            );
        }


    } else if (model.type == "art5312" || model.type == "art5315") {


        let legTransformsRight = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.2) },
        ];
        let legTransformsMiddle = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];
        let legTransformsLeft = [
            { position: new THREE.Vector3(-0.15, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];
        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];

        // Kies de juiste URL's afhankelijk van het model type
        const legRightUrl = model.type == "art5312" ? levante_leg_corner_rightUrl : levante_leg_corner_right_mirrorUrl;
        const legMiddleUrl = model.type == "art5312" ? levante_leg_corner_middleUrl : levante_leg_corner_middle_mirrorUrl;
        const legLeftUrl = model.type == "art5312" ? levante_leg_corner_leftUrl : levante_leg_corner_left_mirrorUrl;
        const maleUrl = model.type == "art5312" ? levante_m_maleUrl : levante_m_male_mirrorUrl;
        const femaleUrl = model.type == "art5312" ? levante_m_femaleUrl : levante_m_female_mirrorUrl;

        // Maak een array van promises voor het laden van alle modellen
        loadPromises = [
            loadAndTransformModel(legRightUrl, legTransformsRight, group, '000000', null, 'paint'),
            loadAndTransformModel(legMiddleUrl, legTransformsMiddle, group, '000000', null, 'paint'),
            loadAndTransformModel(legLeftUrl, legTransformsLeft, group, '000000', null, 'paint')
        ];

        // Voeg de stoffering modellen toe als duotone aanwezig is
        if (model.upholsteryDuotone) {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
            );
        } else {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure)
            );
        }

        // Wacht tot alle modellen geladen zijn voordat we ze aan de scène toevoegen


    } else if (model.type == "art5313" || model.type == "art5317") {


        // Transformaties voor de benen
        let legTransformsRight = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0.2) },
        ];
        let legTransformsMiddle = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];
        let legTransformsLeft = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];
        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];

        // Kies de juiste URL's afhankelijk van het model type
        const legRightUrl = model.type == "art5313" ? levante_leg_corner_rightUrl : levante_leg_corner_right_mirrorUrl;
        const legMiddleUrl = model.type == "art5313" ? levante_leg_corner_middleUrl : levante_leg_corner_middle_mirrorUrl;
        const legLeftUrl = model.type == "art5313" ? levante_leg_corner_leftUrl : levante_leg_corner_left_mirrorUrl;
        const maleUrl = model.type == "art5313" ? levante_m_maleUrl : levante_m_male_mirrorUrl;
        const femaleUrl = model.type == "art5313" ? levante_l_femaleUrl : levante_l_female_mirrorUrl;

        // Maak een array van promises voor het laden van alle modellen
        loadPromises = [
            loadAndTransformModel(legRightUrl, legTransformsRight, group, '000000', null, 'paint'),
            loadAndTransformModel(legMiddleUrl, legTransformsMiddle, group, '000000', null, 'paint'),
            loadAndTransformModel(legLeftUrl, legTransformsLeft, group, '000000', null, 'paint')
        ];

        // Voeg de stoffering modellen toe als duotone aanwezig is
        if (model.upholsteryDuotone) {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
            );
        } else {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure)
            );
        }

        // Wacht tot alle modellen geladen zijn voordat we ze aan de scène toevoegen


    } else if (model.type == "art846" || model.type == "art553") {


        // Transformaties voor de benen en elementen
        let legTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];
        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];

        // Kies de juiste URL's voor de benen en stoelafbeeldingen afhankelijk van het model type
        const legLeftUrl = model.type == "art846" ? levante_leg_corner_leftUrl : levante_leg_corner_left_mirrorUrl;
        const longchairUrl = model.type == "art846" ? levante_leg_longchairUrl : levante_leg_longchair_mirrorUrl;
        const maleUrl = model.type == "art846" ? levante_s_maleUrl : levante_s_male_mirrorUrl;
        const femaleUrl = model.type == "art846" ? levante_longchairUrl : levante_longchair_mirrorUrl;

        // Maak een array van promises voor het laden van de modellen
        loadPromises = [
            loadAndTransformModel(legLeftUrl, legTransforms, group, '000000', null, 'paint'),
            loadAndTransformModel(longchairUrl, legTransforms, group, '000000', null, 'paint')
        ];

        // Voeg de stoffering modellen toe als duotone aanwezig is
        if (model.upholsteryDuotone) {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
            );
        } else {
            loadPromises.push(
                loadAndTransformModel(maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure),
                loadAndTransformModel(femaleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure)
            );
        }

        // Wacht tot alle modellen geladen zijn voordat we ze aan de scène toevoegen


    } else if (model.type == "art598" || model.type == "art860") {


        // Transformaties voor de benen en elementen
        let legTransforms;
        let elementTransforms = [
            { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
        ];

        // Laad benen op basis van het type
        if (model.type == "art598") {
            legTransforms = [
                { position: new THREE.Vector3(-0.25, (model.seatHeight == 47 ? 0.03 : 0), 0) },
            ];
            loadPromises.push(
                loadAndTransformModel(levante_leg_corner_leftUrl, legTransforms, group, '000000', null, 'paint', null, null, null)
            );
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
            ];
            loadPromises.push(
                loadAndTransformModel(levante_leg_longchairUrl, legTransforms, group, '000000', null, 'paint', null, null, null)
            );
        } else {
            legTransforms = [
                { position: new THREE.Vector3(0.25, (model.seatHeight == 47 ? 0.03 : 0), 0) },
            ];
            loadPromises.push(
                loadAndTransformModel(levante_leg_corner_left_mirrorUrl, legTransforms, group, '000000', null, 'paint', null, null, null)
            );
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 0) },
            ];
            loadPromises.push(
                loadAndTransformModel(levante_leg_longchair_mirrorUrl, legTransforms, group, '000000', null, 'paint', null, null, null)
            );
        }

        // Laad de elementen afhankelijk van het type en de stoffering
        if (model.type == "art598") {
            if (model.upholsteryDuotone) {
                loadPromises.push(
                    loadAndTransformModel(levante_l_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                    loadAndTransformModel(levante_longchairUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
                );
            } else {
                loadPromises.push(
                    loadAndTransformModel(levante_l_maleUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null),
                    loadAndTransformModel(levante_longchairUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
                );
            }
        } else {
            if (model.upholsteryDuotone) {
                loadPromises.push(
                    loadAndTransformModel(levante_l_male_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure),
                    loadAndTransformModel(levante_longchair_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, model.upholsteryDuotone.path, model.upholsteryDuotone.structure)
                );
            } else {
                loadPromises.push(
                    loadAndTransformModel(levante_l_male_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null),
                    loadAndTransformModel(levante_longchair_mirrorUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
                );
            }
        }

        // Wacht tot alle modellen geladen zijn voordat we ze aan de scène toevoegen


    }
    if (model.footstool == true) {


        // Leg-transformatie afhankelijk van modeltype
        let legTransforms;
        if (model.type == 'art2502' || model.type == 'art3002' || model.type == 'art846' || model.type == 'art553' || model.type == 'art598' || model.type == 'art860' || model.type == 'art6093' || model.type == 'art9091') {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0) },
            ];
        } else if (model.type == 'art5314' || model.type == 'art5316' || model.type == 'art5315' || model.type == 'art5317') {
            legTransforms = [
                { position: new THREE.Vector3(0.6, (model.seatHeight == 47 ? 0.03 : 0), 0.6), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(90), 0) },
            ];
        } else if (model.type == 'art6091') {
            legTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0) },
            ];
        } else {
            legTransforms = [
                { position: new THREE.Vector3(-0.5, (model.seatHeight == 47 ? 0.03 : 0), 0.5) },
            ];
        }

        // Array om alle promises op te slaan
        

        // Laad de benen van de stoel
        loadPromises.push(
            loadAndTransformModel(levante_legs_footstoolUrl, legTransforms, group, '000000', null, 'paint', null, null, null)
        );

        // Element-transformatie afhankelijk van modeltype
        let elementTransforms;
        if (model.type == 'art2502' || model.type == 'art3002' || model.type == 'art846' || model.type == 'art553' || model.type == 'art598' || model.type == 'art860' || model.type == 'art6093' || model.type == 'art9091') {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0) },
            ];
        } else if (model.type == 'art5314' || model.type == 'art5316' || model.type == 'art5315' || model.type == 'art5317') {
            elementTransforms = [
                { position: new THREE.Vector3(0.6, (model.seatHeight == 47 ? 0.03 : 0), 0.6), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(90), 0) },
            ];
        } else if (model.type == 'art6091') {
            elementTransforms = [
                { position: new THREE.Vector3(0, (model.seatHeight == 47 ? 0.03 : 0), 1.2), rotation: new THREE.Euler(0, THREE.MathUtils.degToRad(45), 0) },
            ];
        } else {
            elementTransforms = [
                { position: new THREE.Vector3(-0.5, (model.seatHeight == 47 ? 0.03 : 0), 0.5) },
            ];
        }

        // Laad de elementen van de stoel
        loadPromises.push(
            loadAndTransformModel(levante_footstoolUrl, elementTransforms, group, null, model.upholstery.path, model.upholstery.structure, null, null, null)
        );



    }
    try {
        await Promise.all(loadPromises); // Wait for all promises to resolve
        scene.add(group); // Add the group containing the loaded models to the scene
        models.push(group); // Add the group to the models array
    } catch (error) {
        console.error("Error loading models:", error); // Handle any errors that occurred during loading
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

const arButton = document.getElementById("arButton");

if (arButton) {
    arButton.addEventListener("click", async () => {
        const loader = document.getElementById("loader");
        loader.style.display = "flex"; // Laat de loader zien

        try {
            const { glbURL, usdzURL } = await exportModel();

            if (uap.getOS().name.toLowerCase().includes("ios") || uap.getBrowser().name.toLowerCase().includes("safari")) {
                if (!usdzURL) {
                    throw new Error('USDZ URL ontbreekt.');
                }
                console.log('Generated URL (iOS):', usdzURL);

                const a = document.createElement('a');
                a.href = usdzURL;
                a.setAttribute('rel', 'ar');
                const img = document.createElement('img');
                img.src = 'img/logo_vanwoerdenwonen.webp';
                img.alt = 'Bekijk in AR';
                a.appendChild(img);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                if (!glbURL) {
                    throw new Error('GLB URL ontbreekt.');
                }

                const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbURL)}&mode=ar_only&resizable=false&disable_occlusion=true#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=vanwoerdenwonen.nl/ar;end;`;
                console.log('Generated URL (Android):', intentUrl);
                window.location.href = intentUrl;
            }
        } catch (error) {
            console.error('Error during AR setup:', error);
            alert('AR-ervaring kon niet worden gestart. Probeer opnieuw.');
        } finally {
            loader.style.display = "none"; // Verberg de loader
        }
    });
} else {
    console.warn("AR-knop niet gevonden, AR-functionaliteit wordt niet geladen.");
}

async function exportModel() {
    const gltfExporter = new GLTFExporter();
    const usdzExporter = new USDZExporter();
    const options = {
        binary: true,
        includeCustomExtensions: true,
    };

    try {
        scene.remove(ground);

        if (uap.getOS().name.toLowerCase().includes("ios") || uap.getBrowser().name.toLowerCase().includes("safari")) {
            // --- Generate USDZ ---
            const usdzBlob = await usdzExporter.parseAsync(scene); // Use async parsing for reliability
            console.log('USDZ Blob created:', usdzBlob);

            if (!usdzBlob) {
                throw new Error('USDZ Blob is undefined. Export failed.');
            }

            // Upload USDZ to storage
            const metadata = {
                contentType: 'model/vnd.usdz+zip', // Proper content type for USDZ
            };
            const usdzRef = ref(storage, 'usdzModels/model.usdz'); // Adjust path as needed
            await uploadBytes(usdzRef, usdzBlob, metadata);
            const usdzURL = await getDownloadURL(usdzRef);
            console.log('USDZ model URL:', usdzURL);

            // Return USDZ URL
            return { usdzURL };

        } else {
            // --- Generate GLB ---
            const glbBlob = await new Promise((resolve, reject) => {
                gltfExporter.parse(
                    scene,
                    (result) => {
                        const blob = new Blob([result], { type: 'model/gltf-binary' });
                        console.log('GLB Blob created:', blob);
                        resolve(blob);
                    },
                    (error) => {
                        console.error('Error during GLB export:', error);
                        reject(error);
                    },
                    options
                );
            });

            // Upload GLB to storage
            const glbRef = ref(storage, 'glbModels/model.glb'); // Adjust path as needed
            await uploadBytes(glbRef, glbBlob);
            const glbURL = await getDownloadURL(glbRef);
            console.log('GLB model URL:', glbURL);

            // Return GLB URL
            return { glbURL };
        }

    } catch (error) {
        // Handle any errors during the export process
        console.error('Error during exportModel:', error);
        throw error; // Re-throw to ensure errors are caught by the caller

    } finally {
        // Add the ground object back to the scene for consistency
        addGround();
    }
}