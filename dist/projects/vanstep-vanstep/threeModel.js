import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { USDZExporter } from 'three/addons/exporters/USDZExporter.js';

export let scene, camera, renderer, controls, rgbeLoader;
let groundGeometry, groundMaterial, ground;

// Gebruik een relatief pad, dat werkt zowel lokaal als online.
export let projectmap = './';

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
    directionalLight.shadow.radius = 2;
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

const mercedes_sprinter_url = projectmap + 'gltf/scene.gltf';
const textureCache = {};

function loadTexture(path) {
    if (textureCache[path]) {
        return textureCache[path];
    } else {
        const texture = new THREE.TextureLoader().load(path);
        textureCache[path] = texture;
        return texture;
    }
}

// Removed createPBRMaterial as mercedes_sprinter is expected to have its own materials.
// If specific parts of the mercedes_sprinter need custom materials, this function
// or a similar one would need to be re-introduced and called conditionally.

function loadAndTransformModel(
    url,
    transforms = [{}],
    group
) {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();

        loader.load(url, function (gltf) {
            let loadedModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = box.getCenter(new THREE.Vector3());
            loadedModel.position.sub(center); // Center the model at (0, 0, 0)

            loadedModel.traverse((child) => {
                if (child.isMesh) {
                    // For mercedes_sprinter, we assume it comes with its own materials.
                    // We do not override them here.

                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            transforms.forEach(transform => {
                const mesh = loadedModel.clone();
                mesh.position.copy(transform.position || new THREE.Vector3());
                mesh.rotation.copy(transform.rotation || new THREE.Euler(0, 0, 0));
                mesh.scale.copy(transform.scale || new THREE.Vector3(1, 1, 1));
                group.add(mesh);
            });


            resolve();
        }, undefined, function (error) {
            reject(error);
        });
    });
}


const models = [];

export async function loadModelData() {
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

    // Load the Mercedes Sprinter model unconditionally
    loadPromises.push(loadAndTransformModel(mercedes_sprinter_url, [{}], group));

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
                //a.href = usdzURL;
                const noScaleURL = usdzURL.includes('?')
                    ? `${usdzURL}&allowsContentScaling=0`
                    : `${usdzURL}?allowsContentScaling=0`;
                a.href = noScaleURL;

                a.setAttribute('rel', 'ar');
                const img = document.createElement('img');
                img.src = 'img/logo_vanstep.webp';
                img.alt = 'Bekijk in AR';
                a.appendChild(img);
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } else {
                if (!glbURL) {
                    throw new Error('GLB URL ontbreekt.');
                }

                const intentUrl = `intent://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbURL)}&mode=ar_only&resizable=false&disable_occlusion=true#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=vanstep.nl/ar;end;`;
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

export async function exportModelAndData(modelConfig) {
    console.log("Model JSON ontvangen in exportModelAndData:", modelConfig);

    const originalSceneUserData = { ...scene.userData }; // Bewaar de originele userData

    // Sla de modelConfig op in de 'extras' van de scene's userData
    scene.userData.extras = {
        ...scene.userData.extras,
        modelConfig: modelConfig
    };

    const exporter = new GLTFExporter();
    const options = { // Definieer export opties, zoals binary: true
        binary: true,
        // inclusief andere opties die je nodig hebt voor GLB export
    };

    // --- Verwijder de ground voordat je exporteert ---
    if (ground && scene.children.includes(ground)) { // Controleer of 'ground' bestaat en in de scene is
        scene.remove(ground);
        console.log("Ground removed before export.");
    }

    try {
        await new Promise((resolve, reject) => {
            exporter.parse(
                scene, // Exporteer de scene met de aangepaste userData
                function (result) {
                    let blob;
                    if (result instanceof ArrayBuffer) {
                        blob = new Blob([result], { type: 'model/gltf-binary' });
                    } else {
                        // Dit pad wordt meestal niet genomen als binary: true is ingesteld
                        const json = JSON.stringify(result);
                        blob = new Blob([json], { type: 'application/json' });
                    }

                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'model_with_config.glb';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);

                    resolve(); // Resolv de Promise na succesvolle export en download
                },
                function (error) { // Error callback voor exporter.parse
                    console.error('Error during GLB export:', error);
                    reject(error);
                },
                options // Geef de opties mee aan parse
            );
        });

    } catch (error) {
        console.error('Error during exportModelAndData:', error);
        throw error; // Her-gooi de fout zodat de aanroepende functie deze kan afhandelen
    } finally {
        // --- Voeg de ground terug toe na de export ---
        // Herstel de originele scene.userData, ongeacht of de export succesvol was
        scene.userData = originalSceneUserData;
        console.log("Scene userData hersteld na export.");

        // Voeg ground terug toe
        addGround();
        console.log("Ground added back after export.");
    }
}
















export async function exportModelWidthDataToPim(modelConfig) {
    console.log("Model JSON ontvangen in exportModelAndData (GLB Upload naar PIM):", modelConfig);

    const originalSceneUserData = { ...scene.userData }; // Bewaar de originele userData

    // Sla de modelConfig op in de 'extras' van de scene's userData
    scene.userData.extras = {
        ...scene.userData.extras,
        modelConfig: modelConfig
    };

    let glbBlob = null;
    let productSku; // Declareer productSku hier
    const uniqueFileId = crypto.randomUUID(); // Unieke ID voor het GLB-bestand

    try {
        // --- 0. Authenticeer anoniem voor PIM Firebase (nodig voor Storage Rules) ---
        console.log("Authenticeer anoniem bij PIM Firebase...");
        //await signInAnonymously(pimAuth);
        console.log("Succesvol anoniem geauthenticeerd bij PIM Firebase.");

        // --- STAP 1: Genereer ALTIJD een NIEUWE, unieke SKU voor dit document. ---
        // Hier wordt de SKU gegenereerd. Als generateProductSkuFromConfig bestaat en een SKU teruggeeft, gebruiken we die.
        // Anders genereren we een geheel nieuwe UUID.
        if (typeof generateProductSkuFromConfig === 'function') {
            const generatedSku = await generateProductSkuFromConfig(modelConfig);
            if (generatedSku) {
                productSku = generatedSku;
                console.log(`SKU gegenereerd via generateProductSkuFromConfig: ${productSku}`);
            } else {
                productSku = crypto.randomUUID(); // Fallback als de functie niets teruggeeft
                console.warn("generateProductSkuFromConfig retourneerde geen geldige SKU. Een nieuwe UUID is gegenereerd als fallback.");
            }
        } else {
            productSku = crypto.randomUUID(); // Fallback als de functie niet bestaat
            console.warn("generateProductSkuFromConfig functie niet gevonden. Een nieuwe UUID is gegenereerd als fallback.");
        }
        // Failsafe: Zorg ervoor dat productSku nooit leeg is
        if (!productSku) {
            productSku = crypto.randomUUID(); // Final failsafe
            console.error("Failsafe: productSku was nog steeds leeg, nieuwe UUID gegenereerd.");
        }

        // --- STAP 2: Exporteer het 3D-model als GLB ---
        console.log("Start GLB export...");
        const exporter = new GLTFExporter();
        const glbOptions = {
            binary: true, // Exporteer als GLB (binair)
        };

        await new Promise((resolve, reject) => {
            exporter.parse(
                scene,
                function (result) {
                    if (result instanceof ArrayBuffer) {
                        glbBlob = new Blob([result], { type: 'model/gltf-binary' });
                        console.log("GLB Blob succesvol gecreëerd.");
                        resolve();
                    } else {
                        console.error("GLB export heeft geen ArrayBuffer opgeleverd.");
                        reject(new Error("GLB export mislukt: geen binaire data."));
                    }
                },
                function (error) {
                    console.error('Fout tijdens GLB export:', error);
                    reject(error);
                },
                glbOptions
            );
        });

        if (!glbBlob) {
            throw new Error("Geen GLB Blob gecreëerd om te uploaden.");
        }

        // --- STAP 3: Upload het GLB naar PIM Firebase Storage ---
        const glbStoragePath = `configured_3d_models/${productSku}/${uniqueFileId}.glb`;
        console.log(`Uploaden GLB naar ${glbStoragePath}...`);
        const glbRef = ref(pimStorage, glbStoragePath);
        const glbUploadResult = await uploadBytes(glbRef, glbBlob);
        const uploadedGlbUrl = await getDownloadURL(glbUploadResult.ref);
        console.log('GLB Upload succesvol:', uploadedGlbUrl);

        // --- STAP 4: Bereid de data voor met de GLB URL ---
        let dataToSend = { ...modelConfig };

        // Verwijder het oude 'id' veld als het in modelConfig zit.
        if (dataToSend.id) {
            console.warn("Oud 'id' veld gevonden in modelConfig. Dit wordt verwijderd ten gunste van 'sku'.", dataToSend.id);
            delete dataToSend.id;
        }

        // Zorg ervoor dat de SKU correct is ingesteld in de data die naar Firestore gaat
        dataToSend.sku = productSku;
        dataToSend.gltfStoragePath = glbStoragePath; // Pad naar GLB in Storage
        dataToSend.gltfUrl = uploadedGlbUrl; // Publieke URL van het GLB
        // Alle screenshot-gerelateerde velden zijn verwijderd

        console.log("Payload die naar PIM Firestore wordt gestuurd:", dataToSend);

        // --- STAP 5: Verstuur de JSON naar Firestore ---
        // Hier wordt de data direct naar PIM Firestore geschreven via de client SDK.
        const pimProductConfigRef = doc(pimFirestore, 'pim_3d_model_configs', productSku);
        await setDoc(pimProductConfigRef, {
            ...dataToSend, // De gecombineerde dataToSend inclusief gltfUrl, sku etc.
            lastUploaded: serverTimestamp()
        }, { merge: true });
        console.log(`PIM Firestore geüpdatet voor SKU: ${productSku}.`);

        alert('Model en configuratie succesvol opgeslagen in PIM!');

        return {
            uploadedGlbUrl: uploadedGlbUrl,
            message: 'Model en configuratie succesvol opgeslagen in PIM!'
        };

    } catch (error) {
        console.error("Fout bij het opslaan van configuratie of uploaden van bestanden naar PIM:", error);
        alert(`Er is een fout opgetreden: ${error.message}.`);
        throw error;
    } finally {
        // --- Voeg de ground terug toe na de export ---
        scene.userData = originalSceneUserData;
        console.log("Scene userData hersteld na export.");
        addGround();
        console.log("Ground added back after export.");
    }
}















async function uploadScreenshotAndGetUrl() {
    try {
        if (!mainModule || !mainModule.renderer || !mainModule.scene || !mainModule.camera) {
            console.error("mainModule of onderdelen ontbreken voor screenshot.");
            throw new Error("Configurator modules niet klaar voor screenshot.");
        }

        const { dataURL, blob } = captureScreenshot(); // Je bestaande functie

        if (dataURL === 'data:,') {
            console.warn("DataURL is empty after screenshot, canvas might be empty or 0x0.");
            throw new Error("Empty image generated, screenshot failed.");
        }

        // --- STAP 2: Upload de Blob naar Firebase Storage (MODULAIRE SYNTAX) ---
        // Gebruik window.storage (of importeer 'storage' als module)
        const storageInstance = window.storage; // Haal de storage instantie op

        // Genereer een unieke naam voor het bestand in Storage
        const filename = `product_renders/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.png`;

        // Maak een Storage Reference met de modulaire 'ref' functie
        // Gebruik window.ref (of importeer 'ref' als module)
        const imageRef = window.ref(storageInstance, filename); // <-- Aangepast!

        console.log(`Uploading image to: ${filename}`);

        // Upload de bytes (Blob) met de modulaire 'uploadBytes' functie
        // Gebruik window.uploadBytes (of importeer 'uploadBytes' als module)
        const uploadTaskSnapshot = await window.uploadBytes(imageRef, blob); // <-- Aangepast!
        console.log('Image uploaded successfully!');

        // --- STAP 3: Krijg de public download URL (MODULAIRE SYNTAX) ---
        // Gebruik de modulaire 'getDownloadURL' functie
        // Gebruik window.getDownloadURL (of importeer 'getDownloadURL' als module)
        const downloadURL = await window.getDownloadURL(imageRef); // <-- Aangepast!
        console.log('Download URL for image:', downloadURL);

        return downloadURL; // Return the URL

    } catch (e) {
        console.error("Error during image upload:", e);
        throw e; // Re-throw the error for the calling function to handle
    }
}


const PIM_LITE_API_URL = "https://receiveconfiguredproduct-k6mygszfiq-uc.a.run.app/receiveConfiguredProduct";


export async function exportDataToPim(modelConfig) {
    console.log("Model JSON ontvangen in exportDataToPim:", modelConfig);

    try {
        // --- STAP 1: Genereer en upload de afbeelding ---
        // Deze stap moet bovenaan in de try-block gebeuren,
        // voordat je het 'dataToSend' object samenstelt.
        const imageUrl = await uploadScreenshotAndGetUrl();
        if (!imageUrl) {
            throw new Error("Afbeelding URL kon niet worden gegenereerd of geüpload.");
        }

        // --- STAP 2: Bereid de data voor met de afbeelding URL ---
        // Begin met een kopie van de originele modelConfig
        let dataToSend = { ...modelConfig };

        // Verwijder het oude 'id' veld als het in modelConfig zit.
        // We gebruiken 'sku' als de primaire unieke identifier voor het document.
        if (dataToSend.id) {
            console.warn("Oud 'id' veld gevonden in modelConfig. Dit wordt verwijderd ten gunste van 'sku'.", dataToSend.id);
            delete dataToSend.id;
        }

        // Genereer ALTIJD een NIEUWE, unieke SKU voor dit document.
        //dataToSend.sku = generateUniqueId(modelConfig); 
        dataToSend.sku = await generateProductSkuFromConfig(modelConfig);

        // Wijs de ZOWEENS GEGENEREERDE EN GEÜPLOADE afbeelding URL toe aan het 'image' veld.
        dataToSend.image = imageUrl;

        console.log("Payload die naar PIM-Lite wordt gestuurd:", dataToSend);

        // --- STAP 3: Verstuur de JSON naar de Cloud Function ---
        const response = await fetch(PIM_LITE_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataToSend)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Bericht: ${errorText}`);
        }





        exportModelWidthDataToPim(modelConfig);








        const result = await response.json();
        console.log("Configuratie succesvol opgeslagen in PIM-Lite:", result);
        alert("Je geconfigureerde meubel is succesvol opgeslagen in de PIM-Lite!");

    } catch (error) {
        // Vang fouten op van zowel de upload als de fetch
        console.error("Fout bij het opslaan van configuratie of uploaden van afbeelding:", error);
        alert(`Er is een fout opgetreden: ${error.message}.`);
        throw error;
    }
}






































export async function exportModelAndDataNew(modelConfig) {
    console.log("Model JSON ontvangen in exportModelAndData (GLB Upload naar PIM):", modelConfig);

    const originalSceneUserData = { ...scene.userData }; // Bewaar de originele userData

    // Sla de modelConfig op in de 'extras' van de scene's userData
    scene.userData.extras = {
        ...scene.userData.extras,
        modelConfig: modelConfig
    };

    let glbBlob = null;
    let productSku; // Declareer productSku hier

    try {
        console.log("Authenticeer anoniem bij PIM Firebase...");
        await signInAnonymously(pimAuth);
        console.log("Succesvol anoniem geauthenticeerd bij PIM Firebase.");

        const generatedSku = await generateProductSkuFromConfig(modelConfig);

        productSku = generatedSku;
        console.log(`SKU gegenereerd via generateProductSkuFromConfig: ${productSku}`);

        console.log("Bezig met het vastleggen van een screenshot...");
        const { blob: screenshotBlob } = captureScreenshot();
        const screenshotStoragePath = `products_by_sku/${productSku}/thumbnail-temp.png`;
        const screenshotRef = ref(pimStorage, screenshotStoragePath);
        const screenshotUploadResult = await uploadBytes(screenshotRef, screenshotBlob);
        const uploadedScreenshotUrl = await getDownloadURL(screenshotUploadResult.ref);
        console.log('Screenshot upload succesvol:', uploadedScreenshotUrl);

        console.log(`Screenshot geüpload. Bezig met exporteren en uploaden van het 3D-model...`);

        const exporter = new GLTFExporter();
        const glbOptions = {
            binary: true,
        };

        await new Promise((resolve, reject) => {
            exporter.parse(
                scene,
                function (result) {
                    if (result instanceof ArrayBuffer) {
                        glbBlob = new Blob([result], { type: 'model/gltf-binary' });
                        console.log("GLB Blob succesvol gecreëerd.");
                        resolve();
                    } else {
                        console.error("GLB export heeft geen ArrayBuffer opgeleverd.");
                        reject(new Error("GLB export mislukt: geen binaire data."));
                    }
                },
                function (error) {
                    console.error('Fout tijdens GLB export:', error);
                    reject(error);
                },
                glbOptions
            );
        });

        if (!glbBlob) {
            throw new Error("Geen GLB Blob gecreëerd om te uploaden.");
        }

        const glbStoragePath = `products_by_sku/${productSku}/3d-model.glb`;
        console.log(`Uploaden GLB naar ${glbStoragePath}...`);
        const glbRef = ref(pimStorage, glbStoragePath);
        const glbUploadResult = await uploadBytes(glbRef, glbBlob);
        const uploadedGlbUrl = await getDownloadURL(glbUploadResult.ref);
        console.log('GLB Upload succesvol:', uploadedGlbUrl);

        let dataToSend = { ...modelConfig };

        // Verwijder het oude 'id' veld als het in modelConfig zit.
        if (dataToSend.id) {
            console.warn("Oud 'id' veld gevonden in modelConfig. Dit wordt verwijderd ten gunste van 'sku'.", dataToSend.id);
            delete dataToSend.id;
        }

        dataToSend.sku = productSku;
        dataToSend.gltfUrl = uploadedGlbUrl;
        dataToSend.image = uploadedScreenshotUrl;

        console.log("Payload die naar PIM Firestore wordt gestuurd:", dataToSend);

        // --- STAP 5: Verstuur de JSON naar Firestore ---
        // Hier wordt de data direct naar PIM Firestore geschreven via de client SDK.
        const pimProductConfigRef = doc(pimFirestore, 'configuredProducts', productSku);
        await setDoc(pimProductConfigRef, {
            ...dataToSend, // De gecombineerde dataToSend inclusief gltfUrl, sku etc.
            lastUploaded: serverTimestamp()
        }, { merge: true });
        console.log(`PIM Firestore geüpdatet voor SKU: ${productSku}.`);

        alert('Model en configuratie succesvol opgeslagen in PIM!');

        return {
            uploadedGlbUrl: uploadedGlbUrl,
            message: 'Model en configuratie succesvol opgeslagen in PIM!'
        };

    } catch (error) {
        console.error("Fout bij het opslaan van configuratie of uploaden van bestanden naar PIM:", error);
        alert(`Er is een fout opgetreden: ${error.message}.`);
        throw error;
    } finally {
        // --- Voeg de ground terug toe na de export ---
        scene.userData = originalSceneUserData;
        console.log("Scene userData hersteld na export.");
        addGround();
        console.log("Ground added back after export.");
    }
}