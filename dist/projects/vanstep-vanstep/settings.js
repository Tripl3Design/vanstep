"use strict"
var ALLMODELS;
var ALLCOLORS;
var ALLCOMPONENTS;
var FEATUREDMODEL;

const urlParams = new URLSearchParams(window.location.search);

let mainModule = null;

// desktop version
if (windowHeight < windowWidth) {
    const downloadModelButton = document.getElementById('downloadModel');
    if (downloadModelButton) {
        downloadModelButton.addEventListener('click', () => {
            mainModule.exportModelAndData(FEATUREDMODEL);
        });
    } else {
        console.warn("Element with ID 'downloadModel' not found. Model export functionality might be unavailable.");
    }

    const saveConfigButtonButton = document.getElementById('saveConfig');
    if (saveConfigButtonButton) {
        saveConfigButtonButton.addEventListener('click', () => {
            //mainModule.exportDataToPim(FEATUREDMODEL);
            mainModule.exportModelAndDataNew(FEATUREDMODEL);
        });
    } else {
        console.warn("Element with ID 'saveConfig' not found. Model export functionality might be unavailable.");
    }
}

function sortObjectKeysAndArrayElements(value) {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(sortObjectKeysAndArrayElements).sort((a, b) => {
            const stringA = JSON.stringify(a);
            const stringB = JSON.stringify(b);
            if (stringA < stringB) return -1;
            if (stringA > stringB) return 1;
            return 0;
        });
    }

    const sortedKeys = Object.keys(value).sort();
    const sortedObject = {};
    for (const key of sortedKeys) {
        sortedObject[key] = sortObjectKeysAndArrayElements(value[key]);
    }
    return sortedObject;
}

function getStandardizedJsonString(configJson) {
    const tempConfig = JSON.parse(JSON.stringify(configJson));

    // Verwijder de 'pricing' sleutel om de SKU los te koppelen van de prijs.
    if ('pricing' in tempConfig) {
        delete tempConfig.pricing;
    }

    const standardizedConfig = sortObjectKeysAndArrayElements(tempConfig);
    return JSON.stringify(standardizedConfig);
}

async function generateSha256Hash(inputString) {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(inputString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexHash;
}

async function generateProductSkuFromConfig(configJson) {
    const standardizedJsonString = getStandardizedJsonString(configJson);
    console.log("Gestandaardiseerde JSON voor hash:", standardizedJsonString);

    const sku = await generateSha256Hash(standardizedJsonString);
    console.log("Gegenereerde SKU:", sku);
    return sku;
}




async function downloadPdf() {
    try {
        // Verkrijg zowel de dataURL als de Blob van de screenshot
        const { dataURL, blob } = mainModule.captureScreenshot();

        const docRef = await addDoc(collection(db, "clientModels"), {
            brand: brand,
            product: product,
            from: document.referrer,
            model: FEATUREDMODEL,
            timestamp: serverTimestamp()
        });
        console.log("Document saved with ID: ", docRef.id);

        // Gebruik de dataURL voor het maken van de PDF
        createPdf(FEATUREDMODEL, dataURL, title, docRef.id);
    } catch (e) {
        console.error("Error: ", e);
    }
}
/*
async function generateImage() {
    try {
        if (mainModule && mainModule.renderer && mainModule.scene && mainModule.camera) {
            // De canvas heeft nu (tijdelijk) een grootte, dus toDataURL() zou moeten werken
            const dataURL = mainModule.renderer.domElement.toDataURL('image/png');
            const imageEl = document.querySelector('.productRender');

            if (imageEl) {
                if (dataURL === 'data:,') {
                    console.warn("DataURL is leeg, waarschijnlijk is de canvas 0x0 of leeg gerenderd.");
                    // Eventueel een fallback afbeelding tonen
                    imageEl.src = 'https://firebasestorage.googleapis.com/v0/b/vanstep-tripletise.appspot.com/o/screenshots%2F1732545295859_screenshot.png?alt=media&token=9c7d7c26-3f52-4b1a-9f7c-2b349703bcf1';
                } else {
                    imageEl.src = dataURL;
                    console.log("Afbeelding succesvol ingesteld met dataURL.");
                }
            } else {
                console.warn("Kan productRender element niet vinden.");
            }
        } else {
            console.error("mainModule of onderdelen ontbreken bij generateImage.");
        }
    } catch (e) {
        console.error("Error bij het genereren van afbeelding:", e);
    }
}
*/
async function shareWithWhatsApp() {
    console.log('shareWithWhatsApp');

    try {
        // Maak een screenshot en verkrijg zowel de dataURL als de Blob
        const { dataURL, blob } = mainModule.captureScreenshot();

        // Upload de Blob naar Firebase Storage
        const storageRef = ref(storage, `screenshots/${Date.now()}_screenshot.png`);
        await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(storageRef);
        console.log("Screenshot uploaded and accessible at: ", imageUrl);

        // Sla de configuratie op in Firestore
        const docRef = await addDoc(collection(db, "clientModels"), {
            brand: brand,
            product: product,
            from: document.referrer,
            model: FEATUREDMODEL,
            imageUrl: imageUrl, // voor Open Graph gebruik
            timestamp: serverTimestamp()
        });
        console.log("Document saved with ID: ", docRef.id);

        const configuratorUrl = `${document.referrer}?brand=${brand}&product=${product}&fsid=${docRef.id}`;
        const message = `Bekijk mijn configurator design!\nKlik hier: ${configuratorUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');

    } catch (e) {
        console.error("Error: ", e);
    }
}

async function shareTroughQr() {
    console.log('shareTroughQr');

    try {
        // Sla de configuratie op in Firestore
        const docRef = await addDoc(collection(db, "clientModels"), {
            brand: brand,
            product: product,
            from: document.referrer,
            model: FEATUREDMODEL,
            timestamp: serverTimestamp()
        });
        console.log("Document saved with ID: ", docRef.id);

        const configuratorUrl = `${document.referrer}?brand=${brand}&product=${product}&fsid=${docRef.id}`;

        // QR-code genereren in de modal
        let qrCanvas = document.getElementById("qrCanvas");
        qrCanvas.innerHTML = "";

        new QRCode(qrCanvas, {
            text: configuratorUrl,
            width: 200,
            height: 200
        });

        // Open de Bootstrap modal
        let qrModal = new bootstrap.Modal(document.getElementById("qrModal"));
        qrModal.show();

    } catch (e) {
        console.error("Error: ", e);
    }
}

async function updateFeaturedModel(model) {
    import('./threeModel.js')
        .then(main => {
            const viewer = document.getElementById('modelviewer');

            if (!mainModule) {
                main.initThree(viewer);
                mainModule = main;
            }
            if (mainModule && typeof mainModule.loadModelData === 'function') {
                mainModule.loadModelData(model);
            }
            if (viewer) {
                viewer.focus();
            }
        })
        .catch(error => {
            console.error('Error loading module:', error);
        });
}

function updateControlPanel(model, selectedLayer, expandedLayer) {
    const settings = initSettings(model);
    const elem = document.getElementById('controlpanelContainer');
    if (selectedLayer !== undefined) {
        controlPanel_updateLayer(selectedLayer, settings);
    } else {
        controlPanel(settings, ALLMODELS, elem, expandedLayer);
    }

    // general
    model.brand = brand;
    model.product = product;
    model.title = title;

    //van
    const setRadioChecked = (name, value) => {
        const selector = `input[type="radio"][name="${name}"][value="${value}"]`;
        const radio = document.querySelector(selector);
        if (radio) {
            radio.checked = true;
        }
    };

    // van
    if (model.van) {
        setRadioChecked('vanBrand', model.van.brand);
        setRadioChecked('vanType', model.van.type);
        setRadioChecked('vanDrive', model.van.drive);
        setRadioChecked('rearWheel', model.van.rearWheel);

        console.log(model.van.type);
        document.getElementById('vanBrandText').textContent = model.van.brand;
        document.getElementById('vanTypeText').textContent = model.van.type;
    }

    // color
    if (model.vanstep && model.vanstep.color) {
        setRadioChecked('vanstepColor', model.vanstep.color.color);
    }

    // Event listener voor kleurverandering om 'geschuurd' optie te tonen/verbergen
    document.querySelectorAll('input[name="vanstepColor"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            const sandedOptionContainer = document.getElementById('sandedOptionContainer');
            const sandedCheckbox = document.getElementById('sanded');

            if (event.target.value === 'black') {
                sandedOptionContainer.classList.remove('d-none');
            } else {
                sandedOptionContainer.classList.add('d-none');
                if (sandedCheckbox) {
                    sandedCheckbox.checked = false;
                    // Update het model object als de optie wordt verborgen
                    if (model.vanstep && model.vanstep.color) {
                        model.vanstep.color.sanded = false;
                    }
                }
            }
        });
        // Trigger de change event om de initiële staat correct in te stellen
        if (radio.checked) radio.dispatchEvent(new Event('change'));
    });









    //pricing(model);

    // is global FEATUREDMODEL for pdf really necessary?
    FEATUREDMODEL = model;

}

function toggleFeaturedModels() {
    let featuredModels = document.getElementById('featuredModels');
    if (urlParams.has('noFeaturedModels')) {
        featuredModels.classList.remove('d-block');
        featuredModels.classList.add('d-none');
    } else {
        featuredModels.classList.remove('d-none');
        featuredModels.classList.add('d-block');
    }
}

function showFeaturedModel(model) {
    updateControlPanel(model, undefined, undefined, 0);
    updateFeaturedModel(model);
}

function showFeaturedModelByIndex(index) {
    showFeaturedModel(JSON.parse(JSON.stringify(ALLMODELS[index])));
}

async function handleModelSelection() {
    //console.log(`BRAND: ${brand}, PRODUCT  ${product}, TITLE ${title}`);

    const colorsPromise = fetch(`projects/${brand}-${product}/colors.json`).then(response => response.json());
    ALLCOLORS = await colorsPromise;
    const modelsPromise = fetch(`projects/${brand}-${product}/models.json`).then(response => response.json());
    ALLMODELS = await modelsPromise;
    const componentsPromise = fetch(`projects/${brand}-${product}/components.json`).then(response => response.json());
    ALLCOMPONENTS = await componentsPromise;

    let modelIndex;
    let modelId;
    let modelFsid;
    let modelData;

    if (urlParams.has('id')) {
        modelId = urlParams.get('id');
        modelIndex = ALLMODELS.findIndex((item) => item.id == modelId);
        showFeaturedModel(ALLMODELS[modelIndex]);
    } else if (urlParams.has('data')) {
        modelData = urlParams.get('data');
        let model = JSON.parse(decodeURIComponent(modelData));
        showFeaturedModel(model);
    } else if (urlParams.has('fsid')) {
        modelFsid = urlParams.get('fsid');
        const docRef = doc(db, "clientModels", modelFsid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists) {
            modelData = docSnap.data().model;
            showFeaturedModel(modelData);
        } else {
            console.error("No document found with FSID:", modelFsid);
        }
    } else {
        modelIndex = Math.floor(Math.random() * ALLMODELS.length);
        showFeaturedModel(ALLMODELS[modelIndex]);
    }
}


function initSettings(model) {
    const accordions = {};

    accordions.vanBrand = {
        title: "merk en type bus",
        options: ['vanBrand', 'vanType'],
        display: "d-block",
        code: /*html*/`
        <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3">
            <div class="d-flex justify-content-start m-0 p-0">
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">merk:</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanBrand" value="volkswagen" id="vanBrand_volkswagen">
                        <label class="form-check-label" for="vanBrand_volkswagen">Volkswagen</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanBrand" value="man" id="vanBrand_man">
                        <label class="form-check-label" for="vanBrand_man">Man</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanBrand" value="mercedes" id="vanBrand_mercedes">
                        <label class="form-check-label" for="vanBrand_mercedes">Mercedes</label>
                    </div>
                </div>
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">type:</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanType" value="l1" id="vanType_l1">
                        <label class="form-check-label" for="vanType_l1">L1</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanType" value="l2" id="vanType_l2">
                        <label class="form-check-label" for="vanType_l2">L2</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanType" value="l3" id="vanType_l3">
                        <label class="form-check-label" for="vanType_l3">L3</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanType" value="l4" id="vanType_l4">
                        <label class="form-check-label" for="vanType_l4">L4</label>
                    </div>
                </div>
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">aandrijving:</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanDrive" value="fwd" id="vanDrive_fwd">
                        <label class="form-check-label" for="vanDrive_fwd">voorwiel</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanDrive" value="rwd" id="vanDrive_rwd">
                        <label class="form-check-label" for="vanDrive_rwd">achterwiel</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanDrive" value="awd" id="vanDrive_awd">
                        <label class="form-check-label" for="vanDrive_awd">vier-wiel</label>
                    </div>
                </div>
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">achterwielen:</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="rearWheel" value="srw" id="rearWheel_srw">
                        <label class="form-check-label" for="rearWheel_srw">enkellucht</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="rearWheel" value="drw" id="rearWheel_drw">
                        <label class="form-check-label" for="rearWheel_drw">dubbellucht</label>
                    </div>
                </div>
            </div>
        </div>`
    };

    accordions.towbar = {
        title: "trekhaak",
        options: ['towbar', 'lightingplug', 'color', 'sanded', 'reverseLights'],
        display: "d-block",
        code: /*html*/`
        <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3">
            <div class="d-flex flex-wrap justify-content-start m-0 p-0">
                <!-- Trekhaak aan/uit -->
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">trekhaak:</div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="towbar" id="towbar">
                    </div>
                </div>

                <!-- Verlichtingsstekker aan/uit -->
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">verlichtingsstekker:</div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="lightingplug" id="lightingplug">
                    </div>
                </div>

                <!-- Kleur van de VanStep -->
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">kleur:</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanstepColor" value="blank" id="vanstepColor_blank">
                        <label class="form-check-label" for="vanstepColor_blank">blank</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanstepColor" value="black" id="vanstepColor_black">
                        <label class="form-check-label" for="vanstepColor_black">zwart</label>
                    </div>
                </div>

                <!-- Geschuurd (alleen bij kleur zwart) -->
                <div id="sandedOptionContainer" class="card border-0 grid gap row-gap-3 me-5 d-none">
                    <div class="fst-italic">afwerking:</div>
                    <div class="h6 fw-normal form-check form-switch">
                        <label class="form-check-label" for="sanded">geschuurd</label>
                        <input type="checkbox" class="form-check-input" name="sanded" id="sanded">
                    </div>
                </div>

                <!-- Achteruitrijlichten -->
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">achteruitrijlichten:</div>
                     <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="reverseLights" id="reverseLights">
                    </div>
                </div>
            </div>
        </div>`
    }


    return { accordions };
}