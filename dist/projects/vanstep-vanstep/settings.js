"use strict"
var ALLMODELS;
var ALLCOLORS;
var ALLCOMPONENTS;
var FEATUREDMODEL;

const urlParams = new URLSearchParams(window.location.search);

let mainModule = null;
let isInitialized = false; // Vlag om te controleren of listeners zijn geïnitialiseerd

// --- SKU GENERATION ---
function sortObjectKeysAndArrayElements(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) {
        return value.map(sortObjectKeysAndArrayElements).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
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
    if ('pricing' in tempConfig) delete tempConfig.pricing;
    const standardizedConfig = sortObjectKeysAndArrayElements(tempConfig);
    return JSON.stringify(standardizedConfig);
}

async function generateSha256Hash(inputString) {
    const data = new TextEncoder().encode(inputString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateProductSkuFromConfig(configJson) {
    const standardizedJsonString = getStandardizedJsonString(configJson);
    const sku = await generateSha256Hash(standardizedJsonString);
    console.log("Generated SKU:", sku);
    return sku;
}

// --- PDF & SHARING ---
async function downloadPdf() {
    try {
        const { dataURL } = mainModule.captureScreenshot();
        const docRef = await addDoc(collection(db, "clientModels"), {
            brand: brand,
            product: product,
            from: document.referrer,
            model: FEATUREDMODEL,
            timestamp: serverTimestamp()
        });
        console.log("Document saved with ID: ", docRef.id);
        createPdf(FEATUREDMODEL, dataURL, title, docRef.id);
    } catch (e) {
        console.error("Error creating PDF: ", e);
    }
}

// --- 3D MODEL & UI ---
async function updateFeaturedModel(model) {
    try {
        if (!mainModule) {
            const main = await import('./threeModel.js');
            const viewer = document.getElementById('modelviewer');
            main.initThree(viewer);
            mainModule = main;
        }
        if (mainModule && typeof mainModule.loadModelData === 'function') {
            await mainModule.loadModelData(model);
        }
    } catch (error) {
        console.error('Error loading 3D module:', error);
    }
}

function updateUI(model) {
    const elem = document.getElementById('controlpanelContainer');

    // Sla de ID's op van de momenteel geopende accordeons
    const expandedAccordionIds = [...elem.querySelectorAll('.accordion-button')]
        .filter(btn => btn.getAttribute('aria-expanded') === 'true')
        .map(btn => btn.getAttribute('data-bs-target'));

    const settings = initSettings(model);
    controlPanel(settings, ALLMODELS, elem);

    // Herstel de staat van de accordeons die open waren
    expandedAccordionIds.forEach(id => {
        const body = elem.querySelector(id);
        const button = elem.querySelector(`[data-bs-target="${id}"]`);
        if (body && button) {
            body.classList.add('show');
            button.classList.remove('collapsed');
            button.setAttribute('aria-expanded', 'true');
        }
    });

    // Update van state
    if (model.van) {
        document.querySelector(`input[name="vanBrand"][value="${model.van.brand}"]`).checked = true;
        document.querySelector(`input[name="vanType"][value="${model.van.type}"]`).checked = true;
        document.querySelector(`input[name="vanDrive"][value="${model.van.drive}"]`).checked = true;
        document.querySelector(`input[name="rearWheel"][value="${model.van.rearWheel}"]`).checked = true;
        document.getElementById('vanBrandText').textContent = model.van.brand;
        document.getElementById('vanTypeText').textContent = model.van.type.toUpperCase();
    }

    // Update accessories state
    document.getElementById('vanstep').checked = !!model.vanstep;
    document.getElementById('collapsibleStair').checked = !!model.stair;
    document.getElementById('sidebars').checked = !!model.sidebars;
    document.getElementById('sunVisor').checked = !!model.sunvisor;

    if (model.vanstep) {
        document.getElementById('towbar').checked = !!model.vanstep.towbar;
        document.getElementById('lightingplug').checked = model.vanstep.towbar?.lightingPlug || false;
        document.getElementById('reverseLights').checked = !!model.vanstep.reverseLights;
        document.querySelector(`input[name="vanstepColor"][value="${model.vanstep.color.color}"]`).checked = true;
        document.getElementById('sanded').checked = model.vanstep.color.sanded || false;

        document.getElementById('towbarText').textContent = model.vanstep.towbar ? 'met trekhaak' : 'zonder trekhaak';
        document.getElementById('reverseLightsText').textContent = model.vanstep.reverseLights ? 'met lichten' : 'zonder lichten';
        document.getElementById('colorText').textContent = model.vanstep.color.color === 'black' ? 'zwart' : 'blank';
        document.getElementById('sandedText').textContent = model.vanstep.color.sanded ? 'geschuurd' : 'ongeschuurd';

        // Show/hide 'sanded' option
        const sandedContainer = document.getElementById('sandedOptionContainer');
        if (model.vanstep.color.color === 'black') {
            sandedContainer.classList.remove('d-none');
        } else {
            sandedContainer.classList.add('d-none');
        }
    }

    pricing(model);
    FEATUREDMODEL = model;
}

function initializeEventListeners() {
    if (isInitialized) return;

    const controlPanelContainer = document.getElementById('controlpanelContainer');

    controlPanelContainer.addEventListener('change', (e) => {
        const target = e.target;
        if (target.type !== 'radio' && target.type !== 'checkbox') return;

        const name = target.name;
        const value = target.value;
        const checked = target.checked;

        let modelChanged = false;

        // --- Handle Van Options ---
        if (['vanBrand', 'vanType', 'vanDrive', 'rearWheel'].includes(name)) {
            const key = name.replace('van', '').toLowerCase();
            FEATUREDMODEL.van[key] = value;
            modelChanged = true;
        }

        // --- Handle Main Accessories (On/Off) ---
        const accessoryMap = {
            'vanstep': { "color": { "color": "black", "sanded": false } },
            'collapsibleStair': { "color": "standard", "height": false },
            'sidebars': { "color": "standard", "step": false },
            'sunVisor': { "color": "black" }
        };
        const accessoryName = { 'collapsibleStair': 'stair', 'sunVisor': 'sunvisor' }[name] || name;

        if (accessoryMap[name]) {
            if (checked) {
                FEATUREDMODEL[accessoryName] = accessoryMap[name];
            } else {
                delete FEATUREDMODEL[accessoryName];
            }
            modelChanged = true;
        }

        // --- Handle VanStep Specific Options ---
        if (FEATUREDMODEL.vanstep) {
            if (name === 'vanstepColor') {
                FEATUREDMODEL.vanstep.color.color = value;
                if (value !== 'black') FEATUREDMODEL.vanstep.color.sanded = false; // Reset sanded if not black
                modelChanged = true;
            } else if (name === 'sanded') {
                FEATUREDMODEL.vanstep.color.sanded = checked;
                modelChanged = true;
            } else if (name === 'towbar') {
                if (checked) FEATUREDMODEL.vanstep.towbar = { "detacheble": false, "catchJaw": false, "lightingPlug": false };
                else delete FEATUREDMODEL.vanstep.towbar;
                modelChanged = true;
            } else if (name === 'lightingplug') {
                if (FEATUREDMODEL.vanstep.towbar) FEATUREDMODEL.vanstep.towbar.lightingPlug = checked;
                modelChanged = true;
            } else if (name === 'reverseLights') {
                if (checked) FEATUREDMODEL.vanstep.reverseLights = { "dashboardSwitch": "original" };
                else delete FEATUREDMODEL.vanstep.reverseLights;
                modelChanged = true;
            }
        }

        if (modelChanged) {
            console.log('Model updated:', JSON.stringify(FEATUREDMODEL, null, 2));
            updateUI(FEATUREDMODEL);
            updateFeaturedModel(FEATUREDMODEL);
        }
    });

    isInitialized = true;
}

function showFeaturedModel(model) {
    FEATUREDMODEL = JSON.parse(JSON.stringify(model)); // Deep copy to avoid mutation issues
    updateUI(FEATUREDMODEL);
    updateFeaturedModel(FEATUREDMODEL);
    initializeEventListeners(); // Initialize listeners after first render
}

function showFeaturedModelByIndex(index) {
    showFeaturedModel(ALLMODELS[index]);
}

async function handleModelSelection() {
    try {
        const [colors, models, components] = await Promise.all([
            fetch(`projects/${brand}-${product}/colors.json`).then(res => res.json()),
            fetch(`projects/${brand}-${product}/models.json`).then(res => res.json()),
            fetch(`projects/${brand}-${product}/components.json`).then(res => res.json())
        ]);
        ALLCOLORS = colors;
        ALLMODELS = models;
        ALLCOMPONENTS = components;

        let modelData;
        if (urlParams.has('fsid')) {
            const modelFsid = urlParams.get('fsid');
            const docRef = doc(db, "clientModels", modelFsid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                modelData = docSnap.data().model;
            } else {
                console.error("No document found with FSID:", modelFsid);
            }
        } else if (urlParams.has('id')) {
            const modelId = urlParams.get('id');
            modelData = ALLMODELS.find((item) => item.id == modelId);
        }

        showFeaturedModel(modelData || ALLMODELS[0]); // Fallback to first model

    } catch (error) {
        console.error("Failed to load initial data:", error);
    }
}

function initSettings(model) {
    const accordions = {};

    accordions.van = {
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

    accordions.options = {
        title: "accessoires",
        options: [],
        display: "d-block",
        code: /*html*/`
        <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3">
            <div class="d-flex justify-content-start m-0 p-0">
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="vanstep" id="vanstep">
                        <label class="form-check-label" for="vanstep">VanStep</label>
                    </div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="collapsibleStair" id="collapsibleStair">
                        <label class="form-check-label" for="collapsibleStair">Inklapbare trap</label>
                    </div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="sidebars" id="sidebars">
                        <label class="form-check-label" for="sidebars">Sidebars</label>
                    </div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="sunVisor" id="sunVisor">
                        <label class="form-check-label" for="sunVisor">Zonneklep</label>
                    </div>
                </div>
            </div>
        </div>`
    };

    if (model.vanstep) {
        accordions.vanstepOptions = {
            title: "vanstep opties",
            options: ['color', 'sanded', 'towbar', 'reverseLights'],
            display: "d-block",
            code: /*html*/`
            <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3 gy-4">
                <div class="col-12 col-md-auto me-md-5">
                    <div class="fst-italic mb-2">Trekhaak & verlichting</div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="towbar" id="towbar">
                        <label class="form-check-label" for="towbar">Trekhaak</label>
                    </div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="lightingplug" id="lightingplug">
                        <label class="form-check-label" for="lightingplug">Verlichtingsstekker</label>
                    </div>
                    <div class="h6 fw-normal form-check form-switch">
                        <input type="checkbox" class="form-check-input" name="reverseLights" id="reverseLights">
                        <label class="form-check-label" for="reverseLights">Achteruitrijlichten</label>
                    </div>
                </div>
                <div class="col-12 col-md-auto">
                    <div class="fst-italic mb-2">Kleur & afwerking</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanstepColor" value="blank" id="vanstepColor_blank">
                        <label class="form-check-label" for="vanstepColor_blank">Blank</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanstepColor" value="black" id="vanstepColor_black">
                        <label class="form-check-label" for="vanstepColor_black">Zwart</label>
                    </div>
                    <div id="sandedOptionContainer" class="h6 fw-normal form-check form-switch ps-5 d-none">
                        <input type="checkbox" class="form-check-input" name="sanded" id="sanded">
                        <label class="form-check-label" for="sanded">Geschuurd</label>
                    </div>
                </div>
            </div>`
        }
    }

    return { accordions };
}
