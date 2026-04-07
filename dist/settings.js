"use strict"
var ALLMODELS;
var ALLCOLORS;
var FEATUREDMODEL;

const urlParams = new URLSearchParams(window.location.search);

let mainModule = null;
let cachedVanstep = null;
let isControlPanelInitialized = false;

function validateLicensePlate(plate, country) {
    if (!plate || plate.trim() === '') return true; // Een leeg veld is geldig.

    const normalizedPlate = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (country === 'nl') {
        // Validatie voor veelvoorkomende Nederlandse kentekenformaten.
        if (/[IOQ]/.test(normalizedPlate)) return false; // Verboden letters.

        const patterns = [
            /^[A-Z]{2}\d{4}$/,       // XX-99-99
            /^\d{2}[A-Z]{2}\d{2}$/,   // 99-XX-99
            /^\d{4}[A-Z]{2}$/,       // 99-99-XX
            /^[A-Z]{2}\d{2}[A-Z]{2}$/, // XX-99-XX
            /^[A-Z]{2}[A-Z]{2}\d{2}$/, // XX-XX-99
            /^\d{2}[A-Z]{2}[A-Z]{2}$/, // 99-XX-XX
            /^\d{2}[A-Z]{3}\d{1}$/,   // 99-XXX-9
            /^\d{1}[A-Z]{3}\d{2}$/,   // 9-XXX-99
            /^[A-Z]{2}\d{3}[A-Z]{1}$/,   // XX-999-X
            /^[A-Z]{1}\d{3}[A-Z]{2}$/,   // X-999-XX
            /^[A-Z]{3}\d{2}[A-Z]{1}$/,   // XXX-99-X
            /^[A-Z]{1}\d{2}[A-Z]{3}$/,   // X-99-XXX
        ];
        return patterns.some(pattern => pattern.test(normalizedPlate));
    } else if (country === 'de') {
        // Vereenvoudigde validatie voor Duitse kentekens.
        const pattern = /^[A-Z]{1,3}[A-Z]{1,2}\d{1,4}$/;
        return pattern.test(normalizedPlate.replace(/[ÄÖÜ]/g, ''));
    }
    return true; // Standaard geldig als land onbekend is.
}

function validateChassisNumber(vin) {
    if (!vin || vin.trim() === '') return true; // Een leeg veld is geldig (optioneel).

    const normalizedVin = vin.toUpperCase();
    // Regel: 17 tekens, A-Z en 0-9, maar GEEN I, O of Q.
    const vinRegex = /^[A-HJ-NPR-Z0-9]{17}$/;
    return vinRegex.test(normalizedVin);
}

async function downloadPdf() {
    console.log(FEATUREDMODEL, brand, product, title);
    try {
        const { dataURL, blob } = mainModule.captureScreenshot();

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
        console.error("Error: ", e);
    }
}

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
        qrCanvas.innerHTML = ""; // Leegmaken voordat we een nieuwe genereren

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

function updateFeaturedModel(model) {
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

const setRadioValue = (model, name, value) => {
    // Update het model direct, onafhankelijk van de DOM status
    let modelKey = name;
    if (name === 'vanBrand') modelKey = 'brand';
    if (name === 'vanLenght') modelKey = 'lenght';
    if (name === 'vanHeight') modelKey = 'height';
    if (name === 'vanDrive') modelKey = 'drive';
    model.van[modelKey] = value;
};

const mapRdwToForm = (model, vehicle) => {
    const chassisInput = document.getElementById('chassisNumber');
    const rdwInfoDiv = document.getElementById('rdwVehicleInfo');
    const lookupString = `${vehicle.handelsbenaming} ${vehicle.typeinrichtingsomschrijving}`.toUpperCase();
    const merk = (vehicle.merk || "").toUpperCase();
    model.van.type = (vehicle.handelsbenaming || "").toLowerCase();
    console.log("Merk uit RDW:", merk);

    if (vehicle.chassisnummer && chassisInput) {
        chassisInput.value = vehicle.chassisnummer;
        model.van.chassisNumber = vehicle.chassisnummer;
    }

    // Bepaal het merk en reset het als het niet wordt herkend.
    if (merk.includes('MERCEDES')) {
        setRadioValue(model, 'vanBrand', 'mercedes');
    } else if (merk.includes('VOLKSWAGEN')) {
        setRadioValue(model, 'vanBrand', 'volkswagen');
    } else if (merk.includes('MAN')) {
        setRadioValue(model, 'vanBrand', 'man');
    } else if (merk.includes('FORD')) {
        setRadioValue(model, 'vanBrand', 'ford');
    } else {
        setRadioValue(model, 'vanBrand', merk.toLowerCase());
    }
    let isValidVehicle = false;
    if (merk.includes('MERCEDES') && lookupString.includes('SPRINTER')) isValidVehicle = true;
    else if (merk.includes('VOLKSWAGEN') && lookupString.includes('CRAFTER')) isValidVehicle = true;
    else if (merk.includes('MAN') && lookupString.includes('TGE')) isValidVehicle = true;
    else if (merk.includes('FORD') && lookupString.includes('TRANSIT')) isValidVehicle = true;

    const formatName = (str) => (str || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    const prettyVehicleName = `${formatName(vehicle.merk)} ${formatName(vehicle.handelsbenaming)}`;

    if (isValidVehicle) {
        model.van.rdwInfo = `<span class="text-success">Dit kenteken hoort bij een ${prettyVehicleName}.</span>`;
    } else {
        model.van.rdwInfo = `<span class="text-danger">Voor een ${prettyVehicleName} is een Vanstep niet geschikt</span>`;
    }

    if (rdwInfoDiv) {
        rdwInfoDiv.innerHTML = model.van.rdwInfo;
    }

    const variant = (vehicle.variant || "").toUpperCase();

    // Bepaal lengte eerst op basis van wielbasis (fysieke maat is leidend)
    let lengthSet = false;
    const wb = parseInt(vehicle.wielbasis);
    if (wb) {
        if (merk.includes('MERCEDES')) {
            if (wb < 340) setRadioValue(model, 'vanLenght', 'L1');
            else if (wb < 400) setRadioValue(model, 'vanLenght', 'L2');
            else setRadioValue(model, 'vanLenght', 'L3');
            lengthSet = true;
        } else if (merk.includes('VOLKSWAGEN') || merk.includes('MAN')) {
            if (wb < 400) setRadioValue(model, 'vanLenght', 'L2');
            else setRadioValue(model, 'vanLenght', 'L3');
            lengthSet = true;
        } else if (merk.includes('FORD')) {
            if (wb < 350) setRadioValue(model, 'vanLenght', 'L2');
            else setRadioValue(model, 'vanLenght', 'L3');
            lengthSet = true;
        }
    }

    // Fallback naar variant code als wielbasis geen uitsluitsel geeft
    if (!lengthSet) {
        const variantLMatch = variant.match(/^L[1-4]/);
        const lookupLMatch = lookupString.match(/L[1-4]/);
        if (variantLMatch) setRadioValue(model, 'vanLenght', variantLMatch[0]);
        else if (lookupLMatch) setRadioValue(model, 'vanLenght', lookupLMatch[0]);
    }

    // --- Hoogte bepaling (aangepast) ---
    let heightSet = false;
    const variantHMatch = variant.match(/H[1-3]/);
    const lookupHMatch = lookupString.match(/H[1-3]/);

    if (variantHMatch) {
        setRadioValue(model, 'vanHeight', variantHMatch[0]);
        heightSet = true;
    } else if (lookupHMatch) {
        setRadioValue(model, 'vanHeight', lookupHMatch[0]);
        heightSet = true;
    }

    // Extra logica voor Mercedes variant codes (bv. L2M...)
    // Zoek naar patroon L[1-4] gevolgd door N, M, H of S
    const mercedesHeightMatch = variant.match(/^L[1-4]([NMHS])/);
    if (!heightSet && merk.includes('MERCEDES') && mercedesHeightMatch) {
        const heightCode = mercedesHeightMatch[1];
        console.log("Hoogte code uit Mercedes variant:", heightCode);

        if (heightCode === 'N') { // Normal roof
            setRadioValue(model, 'vanHeight', 'H1');
            heightSet = true;
        } else if (heightCode === 'M' || heightCode === 'H') { // Medium/High roof
            setRadioValue(model, 'vanHeight', 'H2');
            heightSet = true;
        } else if (heightCode === 'S') { // Super-high roof
            setRadioValue(model, 'vanHeight', 'H3');
            heightSet = true;
        }
    }

    // Fallback naar hoogte_voertuig als laatste redmiddel
    if (!heightSet) {
        const heightCm = parseInt(vehicle.hoogte_voertuig);
        if (heightCm) {
            console.log("Hoogte (fallback) uit RDW:", heightCm);
            if (heightCm < 250) setRadioValue(model, 'vanHeight', 'H1');
            else if (heightCm < 275) setRadioValue(model, 'vanHeight', 'H2');
            else setRadioValue(model, 'vanHeight', 'H3');
        }
    }
    // --- Einde hoogte bepaling ---

    // --- Kleur bepaling ---
    let matchedColor = null;
    const rdwColor = (vehicle.eerste_kleur || "").toUpperCase();

    if (rdwColor && rdwColor !== "N.V.T." && typeof ALLCOLORS !== 'undefined' && ALLCOLORS.vancolors) {
        console.log("Kleur uit RDW:", rdwColor);
        // Zoek een kleur in de configuratie die overeenkomt met de RDW kleur (bijv. 'WIT' in 'Poolwit')
        matchedColor = ALLCOLORS.vancolors.find(c => {
            const name = (c.colorNameNL || "").toUpperCase();
            return name.includes(rdwColor);
        });
    }

    if (matchedColor) {
        model.van.color = matchedColor.colorHex;
    } else {
        // Fallback naar wit als geen kleur is gevonden of RDW kleur ongeldig is.
        console.log("Geen RDW kleur match gevonden of RDW kleur is ongeldig, fallback naar wit.");
        const whiteColor = ALLCOLORS.vancolors.find(c => (c.colorNameNL || "").toUpperCase().includes("WIT"));
        if (whiteColor) {
            model.van.color = whiteColor.colorHex;
        } else {
            // Hardcoded fallback als 'wit' niet in de lijst staat.
            model.van.color = "FFFFFF";
        }
    }

    if (lookupString.includes('4MATIC') || lookupString.includes('4MOTION') || lookupString.includes('AWD')) setRadioValue(model, 'vanDrive', 'awd');
    else if (lookupString.includes('RWD') || lookupString.includes('ACHTERWIEL')) setRadioValue(model, 'vanDrive', 'rwd');

    if (lookupString.includes('DUBBELLUCHT') || lookupString.includes('DRW')) setRadioValue(model, 'rearWheel', 'drw');
    else setRadioValue(model, 'rearWheel', 'srw');
};

const fetchRdwData = async (model, plate) => {
    const licensePlateInput = document.getElementById('licensePlate');
    const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (cleanPlate.length < 6) return;

    console.log(`Start RDW API verzoek voor: ${cleanPlate}`);
    if (licensePlateInput) licensePlateInput.classList.add('loading');
    if (licensePlateInput) licensePlateInput.classList.remove('is-valid', 'is-invalid');

    try {
        const response = await fetch(`https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${cleanPlate}`);
        if (!response.ok) throw new Error(`RDW API reageerde met status: ${response.status}`);
        const data = await response.json();
        if (data && data.length > 0) {
            console.log("RDW Data gevonden:", data[0]);
            mapRdwToForm(model, data[0]);
            console.log("Model na RDW update:", model);
            if (licensePlateInput) licensePlateInput.classList.add('is-valid');
            updateFeaturedModel(model);
            updateControlPanel(model, 'van');
        } else {
            if (licensePlateInput) licensePlateInput.classList.add('is-invalid');
        }
    } catch (err) {
        console.error("RDW Error:", err);
        if (licensePlateInput) licensePlateInput.classList.add('is-invalid');
    } finally {
        if (licensePlateInput) licensePlateInput.classList.remove('loading');
    }
};

function setupControlPanelListeners() {
    const container = document.getElementById('controlpanelContainer');
    if (!container || isControlPanelInitialized) return;

    console.log("Attaching event listeners...");

    container.addEventListener('change', e => {
        const target = e.target;
        const name = target.name;
        const value = target.value;
        const checked = target.checked;

        let panelToUpdate = undefined;
        let expandedLayer = undefined;

        switch (name) {
            case 'country': FEATUREDMODEL.van.country = value; panelToUpdate = 'van'; break;
            case 'vanBrand': FEATUREDMODEL.van.brand = value; panelToUpdate = 'van'; break;
            case 'vanLenght': FEATUREDMODEL.van.lenght = value; panelToUpdate = 'van'; break;
            case 'vanHeight':
                FEATUREDMODEL.van.height = value;
                if (value === 'H3') {
                    delete FEATUREDMODEL.stair;
                } else if (FEATUREDMODEL.stair) {
                    // Update stair height if van height changes
                    FEATUREDMODEL.stair.height = (value === 'H1') ? 'H1' : 'H2';
                }
                panelToUpdate = undefined;
                expandedLayer = 'van';
                break;
            case 'vanDrive': FEATUREDMODEL.van.drive = value; panelToUpdate = 'van'; break;
            case 'rearWheel': FEATUREDMODEL.van.rearWheel = value; panelToUpdate = 'van'; break;

            case 'vanstep':
                if (checked) FEATUREDMODEL.vanstep = cachedVanstep || { towbar: false, color: { color: "blank" }, lights: false, mounting: true };
                else { cachedVanstep = FEATUREDMODEL.vanstep; delete FEATUREDMODEL.vanstep; }
                panelToUpdate = 'vanstepOptions';
                break;
            case 'vanstepColor': if (FEATUREDMODEL.vanstep) FEATUREDMODEL.vanstep.color.color = value; panelToUpdate = 'vanstepOptions'; break;
            case 'vanstepMounting': if (FEATUREDMODEL.vanstep) FEATUREDMODEL.vanstep.mounting = checked; panelToUpdate = 'vanstepOptions'; break;
            case 'towbar':
                if (FEATUREDMODEL.vanstep) {
                    if (checked) FEATUREDMODEL.vanstep.towbar = { type: 'standard' };
                    else delete FEATUREDMODEL.vanstep.towbar;
                }
                panelToUpdate = undefined;
                expandedLayer = 'vanstepOptions';
                break;
            case 'rearlights':
                if (FEATUREDMODEL.vanstep) {
                    if (checked) FEATUREDMODEL.vanstep.lights = { dashboardSwitch: 'original' };
                    else delete FEATUREDMODEL.vanstep.lights;
                }
                panelToUpdate = undefined;
                expandedLayer = 'vanstepOptions';
                break;
            case 'towbarType': if (FEATUREDMODEL.vanstep?.towbar) FEATUREDMODEL.vanstep.towbar.type = value; panelToUpdate = 'towbarOptions'; expandedLayer = 'towbarOptions'; break;
            case 'variobloc': if (FEATUREDMODEL.vanstep?.towbar) FEATUREDMODEL.vanstep.towbar.variobloc = checked; panelToUpdate = 'towbarOptions'; expandedLayer = 'towbarOptions'; break;

            case 'sidebars':
                if (checked) FEATUREDMODEL.sidebars = { color: "black", step: false, mounting: true };
                else delete FEATUREDMODEL.sidebars;
                panelToUpdate = 'sidebarsOptions';
                expandedLayer = 'sidebarsOptions';
                break;
            case 'sidebarsColor': if (FEATUREDMODEL.sidebars) FEATUREDMODEL.sidebars.color = value; panelToUpdate = 'sidebarsOptions'; break;
            case 'sidebarsMounting': if (FEATUREDMODEL.sidebars) FEATUREDMODEL.sidebars.mounting = checked; panelToUpdate = 'sidebarsOptions'; break;

            case 'stair':
                if (checked) {
                    // Determine correct stair height based on van height
                    const h = (FEATUREDMODEL.van.height === 'H1') ? 'H1' : 'H2';
                    FEATUREDMODEL.stair = { height: h, mounting: true };
                }
                else delete FEATUREDMODEL.stair;
                panelToUpdate = 'stairOptions';
                break;
            case 'stairMounting': if (FEATUREDMODEL.stair) FEATUREDMODEL.stair.mounting = checked; panelToUpdate = 'stairOptions'; break;

            case 'sunvisor':
                if (checked) FEATUREDMODEL.sunvisor = { lights: true, mounting: true };
                else delete FEATUREDMODEL.sunvisor;
                panelToUpdate = 'sunvisorOptions';
                expandedLayer = 'sunvisorOptions';
                break;
            case 'sunvisorLight': if (FEATUREDMODEL.sunvisor) FEATUREDMODEL.sunvisor.lights = checked; panelToUpdate = 'sunvisorOptions'; break;
            case 'sunvisorMounting': if (FEATUREDMODEL.sunvisor) FEATUREDMODEL.sunvisor.mounting = checked; panelToUpdate = 'sunvisorOptions'; break;
        }

        updateControlPanel(FEATUREDMODEL, panelToUpdate, expandedLayer);
        updateFeaturedModel(FEATUREDMODEL);
        if (panelToUpdate) showSelected(false);
    });

    container.addEventListener('input', e => {
        const target = e.target;
        if (target.id === 'licensePlate') {
            let value = target.value;
            const country = FEATUREDMODEL.van.country;

            // Formatteren voor NL kentekens
            if (country === 'nl') {
                let val = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

                // Nieuwe logica: splits op type-wisseling (cijfer <-> letter)
                let parts = [];
                let currentPart = '';
                for (let i = 0; i < val.length; i++) {
                    let char = val[i];
                    let type = /\d/.test(char) ? 'digit' : 'letter';
                    if (currentPart.length === 0) {
                        currentPart += char;
                    } else {
                        let lastChar = currentPart[currentPart.length - 1];
                        let lastType = /\d/.test(lastChar) ? 'digit' : 'letter';
                        if (type !== lastType) {
                            parts.push(currentPart);
                            currentPart = char;
                        } else {
                            currentPart += char;
                        }
                    }
                }
                if (currentPart) parts.push(currentPart);

                // Correcties voor 2-2-2 formaten zonder type-wisseling in het midden
                if (parts.length === 2 && parts[0].length === 2 && parts[1].length === 4 && /^[A-Z]+$/.test(parts[0])) parts = [parts[0], parts[1].slice(0, 2), parts[1].slice(2)]; // XX-9999 -> XX-99-99
                else if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 2 && /^\d+$/.test(parts[0])) parts = [parts[0].slice(0, 2), parts[0].slice(2), parts[1]]; // 9999-XX -> 99-99-XX
                else if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 2 && /^[A-Z]+$/.test(parts[0])) parts = [parts[0].slice(0, 2), parts[0].slice(2), parts[1]]; // XXXX-99 -> XX-XX-99
                else if (parts.length === 2 && parts[0].length === 2 && parts[1].length === 4 && /^\d+$/.test(parts[0])) parts = [parts[0], parts[1].slice(0, 2), parts[1].slice(2)]; // 99-XXXX -> 99-XX-XX

                value = parts.join('-').substring(0, 8);
            } else {
                value = value.toUpperCase();
            }
            target.value = value;

            if (validateLicensePlate(value, country)) {
                target.classList.remove('is-invalid');
                FEATUREDMODEL.van.licensePlate = value;
                updateFeaturedModel(FEATUREDMODEL);
            } else {
                target.classList.add('is-invalid');
            }
        }
        if (target.id === 'chassisNumber') {
            const upperCaseValue = target.value.toUpperCase();
            target.value = upperCaseValue;
            if (validateChassisNumber(upperCaseValue)) {
                target.classList.remove('is-invalid');
                FEATUREDMODEL.van.chassisNumber = upperCaseValue;
            } else {
                target.classList.add('is-invalid');
            }
        }
    });

    container.addEventListener('click', e => {
        const target = e.target;
        if (target.classList.contains('vancolors_colorButton')) {
            document.querySelectorAll('.vancolors_colorButton').forEach(item => item.classList.remove('colorButtonActive'));
            const colorId = target.id.split('_');
            const colorIndex = colorId[1];
            FEATUREDMODEL.van.color = ALLCOLORS.vancolors[colorIndex].colorHex;
            target.classList.add('colorButtonActive');
            updateControlPanel(FEATUREDMODEL, 'van');
            updateFeaturedModel(FEATUREDMODEL);
            showSelected(true);
        }
    });

    container.addEventListener('focusout', e => {
        if (e.target.id === 'licensePlate' && FEATUREDMODEL.van.country === 'nl') {
            fetchRdwData(FEATUREDMODEL, e.target.value);
        }
    });

    isControlPanelInitialized = true;
}

function updateControlPanel(model, selectedLayer, expandedLayer) {
    FEATUREDMODEL = model;
    const settings = initSettings(model);
    const elem = document.getElementById('controlpanelContainer');

    if (selectedLayer !== undefined) {
        controlPanel_updateLayer(selectedLayer, settings);
    } else {
        controlPanel(settings, ALLMODELS, elem, expandedLayer);
    }

    setupControlPanelListeners();

    // --- UPDATE UI STATE ---
    // This part ensures the UI always reflects the current model state after any render.

    // Van Section
    const vanBrandEl = document.getElementById(`vanBrand_${model.van.brand}`);
    if (vanBrandEl) vanBrandEl.checked = true;

    const vanLenghtEl = document.getElementById(`vanLenght_${model.van.lenght.toUpperCase()}`);
    if (vanLenghtEl) vanLenghtEl.checked = true;

    const vanHeightEl = document.getElementById(`vanHeight_${model.van.height.toUpperCase()}`);
    if (vanHeightEl) vanHeightEl.checked = true;

    const vanDriveEl = document.getElementById(`vanDrive_${model.van.drive}`);
    if (vanDriveEl) vanDriveEl.checked = true;

    const vanRearWheelEl = document.getElementById(`vanRearWheel_${model.van.rearWheel}`);
    if (vanRearWheelEl) vanRearWheelEl.checked = true;

    const supportedBrands = ['volkswagen', 'man', 'mercedes', 'ford'];
    const vanBrandTextEl = document.getElementById('vanBrandText');
    if (vanBrandTextEl) {
        if (supportedBrands.includes(model.van.brand)) {
            const vanType = model.van.type ? model.van.type.charAt(0).toUpperCase() + model.van.type.slice(1) : '';
            vanBrandTextEl.textContent = `${model.van.brand.charAt(0).toUpperCase() + model.van.brand.slice(1)} ${vanType}`;
        } else {
            vanBrandTextEl.textContent = "Voertuig niet geschikt voor Vanstep";
        }
    }
    const vanTypeTextEl = document.getElementById('vanTypeText');
    if (vanTypeTextEl) {
        if (supportedBrands.includes(model.van.brand)) {
            vanTypeTextEl.textContent = `${model.van.lenght.toUpperCase()}${model.van.height.toUpperCase()}`;
        } else {
            vanTypeTextEl.textContent = "";
        }
    }

    const vancolor = model.van.color;
    if (typeof ALLCOLORS !== 'undefined' && ALLCOLORS.vancolors) {
        const colorIndex = ALLCOLORS.vancolors.findIndex(item => item.colorHex === vancolor);
        const colorButton = document.getElementById(`vancolorsIndex_${colorIndex}`);
        if (colorButton) colorButton.classList.add('colorButtonActive');
    }

    // vanstep
    const vanstepCheckbox = document.getElementById('vanstep');
    if (vanstepCheckbox) {
        vanstepCheckbox.checked = !!model.vanstep;
    }
    if (model.vanstep) {
        const vanstepColorRadio = document.getElementById(`vanstepColor_${model.vanstep.color.color}`);
        if (vanstepColorRadio) vanstepColorRadio.checked = true;

        const vanstepTowbarAttachementCheckbox = document.getElementById('vanstepTowbarAttachement');
        if (vanstepTowbarAttachementCheckbox) vanstepTowbarAttachementCheckbox.checked = !!model.vanstep.towbar;

        const vanstepRearlightsCheckbox = document.getElementById('vanstepRearlights');
        if (vanstepRearlightsCheckbox) vanstepRearlightsCheckbox.checked = !!model.vanstep.lights;

        const vanstepMountingCheckbox = document.getElementById('vanstepMounting');
        if (vanstepMountingCheckbox) vanstepMountingCheckbox.checked = !!model.vanstep.mounting;

        const towbarStandard = document.getElementById('towbarStandard');
        const catchJaw = document.getElementById('catchJaw');
        const variobloc = document.getElementById('variobloc');

        if (towbarStandard) towbarStandard.disabled = !model.vanstep.towbar;
        if (catchJaw) catchJaw.disabled = !model.vanstep.towbar;
        if (variobloc) variobloc.disabled = !model.vanstep.towbar;

        if (model.vanstep.towbar) {
            const towbarTypeRadio = document.querySelector(`input[name="towbarType"][value="${model.vanstep.towbar.type}"]`);
            if (towbarTypeRadio) towbarTypeRadio.checked = true;
            if (variobloc) variobloc.checked = !!model.vanstep.towbar.variobloc;
        }


    }
    if (model.vanstep) {
        let vanstepColor = model.vanstep.color.color;
        let vanstepColorDutch;
        if (vanstepColor === "blackSanded") {
            vanstepColorDutch = t('zwart_geschuurd');
        }
        else if (vanstepColor === "black") {
            vanstepColorDutch = t('zwart');
        }
        else {
            vanstepColorDutch = t('blank');
        }
        document.getElementById('vanstepColorText').textContent = vanstepColorDutch;

        let towbarSummary = '';
        if (model.vanstep.towbar) {
            towbarSummary = model.vanstep.towbar.type === 'standard' ? t('trekhaakkogel') : t('vangmuil');
            if (model.vanstep.towbar.variobloc) towbarSummary += ` ${t('met')} ${t('wisselplaat')}`;
        }
        document.getElementById('vanstepTowbarText').textContent = towbarSummary;
        document.getElementById('vanstepRearlightsText').textContent = model.vanstep.lights ? t('achteruitrijlichten') : '';
    } else {
        document.getElementById('vanstepColorText').textContent = t('geen_vanstep');
        document.getElementById('vanstepTowbarText').textContent = '';
        document.getElementById('vanstepRearlightsText').textContent = '';
    }

    // sidebars
    const sidebarsCheckbox = document.getElementById('sidebars');
    if (sidebarsCheckbox) {
        sidebarsCheckbox.checked = !!model.sidebars;
        if (model.sidebars) {
            const sidebarsColorRadio = document.getElementById(`sidebarsColor_${model.sidebars.color}`);
            if (sidebarsColorRadio) sidebarsColorRadio.checked = true;
            let sbText = t('zwart');
            if (model.sidebars.color === 'chrome') sbText = t('chroom');
            else if (model.sidebars.color === 'luxury') sbText = t('zwart') + ' (' + t('luxe') + ')';

            document.getElementById('sidebarsColorText').textContent = sbText;

            const sidebarsMountingCheckbox = document.getElementById('sidebarsMounting');
            if (sidebarsMountingCheckbox) sidebarsMountingCheckbox.checked = !!model.sidebars.mounting;
        } else {
            document.getElementById('sidebarsColorText').textContent = t('geen') + ' ' + t('sidebars');
        }
    }

    const stairCheckbox = document.getElementById('stair');
    if (stairCheckbox) {
        stairCheckbox.checked = !!model.stair;
        if (model.stair) {
            const stairMountingCheckbox = document.getElementById('stairMounting');
            if (stairMountingCheckbox) stairMountingCheckbox.checked = !!model.stair.mounting;

            let stairText = t('inklapbare_trap');
            if (model.stair.height === 'H1') stairText += ` (${t('klein')})`;
            else stairText += ` (${t('groot')})`;
            document.getElementById('stairText').textContent = stairText;
        } else {
            document.getElementById('stairText').textContent = t('geen') + ' ' + t('trapje');
        }
    }

    const sunvisorCheckbox = document.getElementById('sunvisor');
    if (sunvisorCheckbox) {
        sunvisorCheckbox.checked = !!model.sunvisor;
        if (model.sunvisor) {
            const sunvisorLightCheckbox = document.getElementById('sunvisorLight');
            if (sunvisorLightCheckbox) sunvisorLightCheckbox.checked = !!model.sunvisor.lights;
            document.getElementById('sunvisorLightText').textContent = model.sunvisor.lights ? t('ledverlichting') : '';
            const sunvisorMountingCheckbox = document.getElementById('sunvisorMounting');
            if (sunvisorMountingCheckbox) sunvisorMountingCheckbox.checked = !!model.sunvisor.mounting;
        } else {
            document.getElementById('sunvisorLightText').textContent = t('geen') + ' ' + t('zonneklep');
        }
    }
    pricing(model);
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

    // Set country based on URL parameter 'lang'
    const lang = urlParams.get('lang');
    model.van.country = (lang === 'de') ? 'de' : 'nl';

    accordions.van = {
        title: t('bus'),
        options: ['vanBrand', 'vanType'],
        display: "d-block",
        code: /*html*/`
        <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3">
            <!-- Kenteken & Chassis 
            <div class="col-12">
                <div class="fst-italic mb-2">${t('kenteken_chassis')}</div>
                <div class="col-12 col-sm-6 col-xl-4 mb-2">
                     <style>
                        @font-face { font-family: 'LicensePlateNL'; src: url('projects/vanstep-vanstep/gltf/vans/textures/LicensePlateNL.ttf'); }
                        @font-face { font-family: 'LicensePlateDE'; src: url('projects/vanstep-vanstep/gltf/vans/textures/LicensePlateDE.ttf'); }
                     </style>
                     <input type="text" class="form-control" style="background-image: url('projects/vanstep-vanstep/gltf/vans/textures/licensePlate_${model.van.country}.jpg'); height: 55px; width: 260px;background-size: 100% 100%; padding-left: 50px; font-weight: bold; text-transform: uppercase; font-family: '${model.van.country === 'de' ? 'LicensePlateDE' : 'LicensePlateNL'}', sans-serif; font-size: 32px; letter-spacing: 2.5px;" name="licensePlate" id="licensePlate" placeholder="${t('kenteken_placeholder')}" value="${model.van.licensePlate || ''}">
                     <div id="rdwVehicleInfo" class="col-12 form-text fw-bold mt-1">${model.van.rdwInfo || ''}</div>
                </div>
                <div class="col-12 col-sm-6 col-xl-4 mb-2">
                     <input type="text" class="form-control" name="chassisNumber" id="chassisNumber" placeholder="${t('chassis_placeholder')}" value="${model.van.chassisNumber || ''}">
                </div>
            </div>-->

            <!-- Chassis -->
            <div class="col-12">
                <div class="fst-italic mb-2">${t('chassisnummer')}</div>
                <div class="col-12 col-sm-6 col-xl-4 mb-2">
                     <input type="text" class="form-control" name="chassisNumber" id="chassisNumber" placeholder="${t('chassis_placeholder')}" value="${model.van.chassisNumber || ''}">
                </div>
            </div>

            <!-- Merk & Type -->
            <div class="col-12 col-md-auto me-md-5">
                <div class="card border-0 grid gap row-gap-3 me-5">
                    <div class="fst-italic">${t('merk_type')}</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanBrand" value="volkswagen" id="vanBrand_volkswagen">
                        <label class="form-check-label text-muted" for="vanBrand_volkswagen">Volkswagen Crafter</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanBrand" value="man" id="vanBrand_man">
                        <label class="form-check-label text-muted" for="vanBrand_man">Man TGE</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanBrand" value="mercedes" id="vanBrand_mercedes">
                        <label class="form-check-label" for="vanBrand_mercedes">Mercedes Sprinter</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanBrand" value="ford" id="vanBrand_ford">
                        <label class="form-check-label text-muted" for="vanBrand_ford">Ford Transit</label>
                    </div>
                </div>
            </div>

            <!-- Lengte & Hoogte -->
            <div class="col-12 col-md-auto d-flex flex-wrap gap-5">
                <div class="card border-0 grid gap row-gap-3">
                    <div class="fst-italic">${t('lengte')}</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanLenght" value="L1" id="vanLenght_L1">
                        <label class="form-check-label" for="vanLenght_L1">L1</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanLenght" value="L2" id="vanLenght_L2">
                        <label class="form-check-label" for="vanLenght_L2">L2</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanLenght" value="L3" id="vanLenght_L3">
                        <label class="form-check-label" for="vanLenght_L3">L3</label>
                    </div>
                </div>
                <!--
                <div class="card border-0 grid gap row-gap-3">
                    <div class="fst-italic">${t('hoogte')}</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanHeight" value="H1" id="vanHeight_H1">
                        <label class="form-check-label" for="vanHeight_H1">H1</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanHeight" value="H2" id="vanHeight_H2">
                        <label class="form-check-label" for="vanHeight_H2">H2</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanHeight" value="H3" id="vanHeight_H3">
                        <label class="form-check-label" for="vanHeight_H3">H3</label>
                    </div>
                </div-->
            </div>

            <!-- Aandrijving & Achterwielen -->
            <div class="col-12 col-md-auto d-flex flex-wrap gap-5">
                <div class="card border-0 grid gap row-gap-3">
                    <div class="fst-italic">${t('aandrijving')}</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanDrive" value="fwd" id="vanDrive_fwd">
                        <label class="form-check-label" for="vanDrive_fwd">${t('voorwiel')}</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanDrive" value="rwd" id="vanDrive_rwd">
                        <label class="form-check-label" for="vanDrive_rwd">${t('achterwiel')}</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="vanDrive" value="awd" id="vanDrive_awd">
                        <label class="form-check-label" for="vanDrive_awd">${t('vier_wiel')}</label>
                    </div>
                </div>
                <div class="card border-0 grid gap row-gap-3">
                    <div class="fst-italic">${t('achterwielen')}</div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="rearWheel" value="srw" id="vanRearWheel_srw">
                        <label class="form-check-label" for="rearWheel_srw">${t('enkellucht')}</label>
                    </div>
                    <div class="h6 fw-normal form-check">
                        <input type="radio" class="form-check-input" name="rearWheel" value="drw" id="vanRearWheel_drw">
                        <label class="form-check-label" for="rearWheel_drw">${t('dubbellucht')}</label>
                    </div>
                </div>
            </div>

            <!-- Kleur 
            <div class="col-12">
                <div class="fst-italic">${t('kleur')}</div>
                <div class="col-12 m-0 p-0">
                    <div id="vancolorsPicker" class="m-0 p-0"></div>
                </div>
            </div>-->
        </div>`,
        // "onload": function () {
        // 5. Kleuren Initialisatie
        //    let containerVancolors = document.getElementById(`vancolorsPicker`);
        //    if (containerVancolors) addColors(`vancolors`, ALLCOLORS.vancolors, containerVancolors);
        //  }
    };

    accordions.vanstepOptions = {
        //checkbox: { id: 'vanstep', name: 'vanstep' },
        enabled: !!model.vanstep,
        title: t('vanstep'),
        options: ['vanstepColor'],
        display: "d-block",
        code: /*html*/`
        <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3 gy-3">
            <div class="col-12 col-md-auto">
                <div class="fst-italic mb-2">${t('kleur')}</div>
                <div class="h6 fw-normal form-check">
                    <input type="radio" class="form-check-input" name="vanstepColor" value="blank" id="vanstepColor_blank">
                    <label class="form-check-label" for="vanstepColor_blank">${t('blank')}</label>
                </div>
                <div class="h6 fw-normal form-check">
                    <input type="radio" class="form-check-input" name="vanstepColor" value="black" id="vanstepColor_black">
                    <label class="form-check-label" for="vanstepColor_black">${t('zwart')}</label>
                </div>
                <div class="h6 fw-normal form-check">
                    <input type="radio" class="form-check-input" name="vanstepColor" value="blackSanded" id="vanstepColor_blackSanded">
                    <label class="form-check-label" for="vanstepColor_blackSanded">${t('zwart_geschuurd')}</label>
                </div>
            </div>
            <div class="col-12 col-md-auto">
                <div class="fst-italic mb-2">${t('opties')}</div>
                <div class="h6 fw-normal form-check">
                    <input type="checkbox" class="form-check-input" name="towbar" id="vanstepTowbarAttachement">
                    <label class="form-check-label" for="vanstepTowbarAttachement">${t('voorbereiding_trekhaak')}</label>
                </div>
                <div class="h6 fw-normal form-check">
                    <input type="checkbox" class="form-check-input" name="rearlights" id="vanstepRearlights">
                    <label class="form-check-label" for="vanstepRearlights">${t('achteruitrijlichten')}</label>
                </div>
                <div class="h6 fw-normal form-check">
                    <input type="checkbox" class="form-check-input" name="vanstepMounting" id="vanstepMounting">
                    <label class="form-check-label" for="vanstepMounting">${t('montage')}</label>
                </div>
            </div>
          
            </div><!--
            <div class="col-12 mt-3">
                <button id="doorAnimationBtn_vanstep" type="button" class="btn btn-outline-dark rounded-0 btn-sm">${t('deuren_openen')}</button>
            </div>-->
        </div>`,
        onload: function () {
            const doorBtn = document.getElementById('doorAnimationBtn_vanstep');
            if (doorBtn) {
                doorBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (mainModule && mainModule.toggleDoors) {
                        mainModule.toggleDoors();
                    }
                });
            }
        }
    };

    accordions.towbarOptions = {
        //checkbox: { id: 'vanstep', name: 'vanstep' },
        enabled: model.vanstep ? !!model.vanstep.towbar : false,
        title: t('trekhaak'),
        options: ['vanstepTowbar'],
        display: (model.vanstep && model.vanstep.towbar) ? "d-block" : "d-none",
        code: /*html*/`
        <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3 gy-3">
            <div class="col-12 col-md-auto">
                <div class="h6 fw-normal form-check">
                    <input type="radio" class="form-check-input" name="towbarType" value="standard" id="towbarStandard">
                    <label class="form-check-label" for="towbarStandard">${t('trekhaakkogel')}</label>
                </div>
                <div class="h6 fw-normal form-check">
                    <input type="radio" class="form-check-input" name="towbarType" value="catchJaw" id="catchJaw">
                    <label class="form-check-label" for="catchJaw">${t('vangmuil')}</label>
                </div>
            </div>
            <div class="col-12 col-md-auto">
                <div class="h6 fw-normal form-check">
                    <input type="checkbox" class="form-check-input" name="variobloc" id="variobloc">
                    <label class="form-check-label" for="variobloc">${t('wisselplaat')}</label>
                </div>
            </div><!--
            <div class="col-12 mt-3">
                <button id="doorAnimationBtn_vanstep" type="button" class="btn btn-outline-dark rounded-0 btn-sm">${t('deuren_openen')}</button>
            </div>-->
        </div>`,
        onload: function () {
            const doorBtn = document.getElementById('doorAnimationBtn_vanstep');
            if (doorBtn) {
                doorBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (mainModule && mainModule.toggleDoors) {
                        mainModule.toggleDoors();
                    }
                });
            }
        }
    };

    accordions.lightingOptions = {
        //checkbox: { id: 'vanstep', name: 'vanstep' },
        enabled: model.vanstep ? !!model.vanstep.lights : false,
        title: t('verlichting'),
        options: ['vanstepRearlights'],
        display: (model.vanstep && model.vanstep.lights) ? "d-block" : "d-none",
        code: /*html*/`
        <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3 gy-3">
            <div class="col-12 col-md-auto">
                <div class="fst-italic mb-2">${t('opties')}</div>
                <div class="h6 fw-normal form-check">
                    <input type="checkbox" class="form-check-input" name="rearlights" id="vanstepRearlights">
                    <label class="form-check-label" for="vanstepRearlights">${t('achteruitrijlichten')}</label>
                </div>
            </div><!--
            <div class="col-12 mt-3">
                <button id="doorAnimationBtn_vanstep" type="button" class="btn btn-outline-dark rounded-0 btn-sm">${t('deuren_openen')}</button>
            </div>-->
        </div>`,
        onload: function () {
            const doorBtn = document.getElementById('doorAnimationBtn_vanstep');
            if (doorBtn) {
                doorBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (mainModule && mainModule.toggleDoors) {
                        mainModule.toggleDoors();
                    }
                });
            }
        }
    };

    /*
        accordions.stairOptions = {
            checkbox: { id: 'stair', name: 'stair' },
            enabled: !!model.stair,
            title: t('trapje'),
            options: ['stair'],
            display: (model.van.height === 'H3') ? "d-none" : "d-block",
            code: `
                <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3">
                    <div class="col-12 col-md-auto">
                        ${t('trapje_verhaal')}
                        <div class="h6 fw-normal form-check mt-2">
                            <input type="checkbox" class="form-check-input" name="stairMounting" id="stairMounting">
                            <label class="form-check-label" for="stairMounting">${t('montage')}</label>
                        </div>
                        <div class="mt-3">
                           <button id="stairAnimationBtn" type="button" class="btn btn-outline-dark rounded-0 btn-sm">${t('trapje_uitklappen')}</button>
                           <button id="doorAnimationBtn_stair" type="button" class="btn btn-outline-dark rounded-0 btn-sm ms-2">${t('deuren_openen')}</button>
                        </div>
                    </div>
                </div>`,
            onload: function () {
                const btn = document.getElementById('stairAnimationBtn');
                if (btn) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (mainModule && mainModule.toggleAnimations) {
                            mainModule.toggleAnimations();
                            if (btn.textContent === t('trapje_uitklappen')) {
                                btn.textContent = t('trapje_inklappen');
                            } else {
                                btn.textContent = t('trapje_uitklappen');
                            }
                        }
                    });
                }
                const doorBtn = document.getElementById('doorAnimationBtn_stair');
                if (doorBtn) {
                    doorBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        if (mainModule && mainModule.toggleDoors) {
                            mainModule.toggleDoors();
                        }
                    });
                }
            }
        };
    
        accordions.sidebarsOptions = {
            checkbox: { id: 'sidebars', name: 'sidebars' },
            enabled: !!model.sidebars,
            title: t('sidebars'),
            options: ['sidebarsColor'],
            display: "d-block",
            code: `
                <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3">
                    <div class="col-12 col-md-auto">
                        <div class="fst-italic mb-2">${t('kleur')}</div>
                        <div class="h6 fw-normal form-check">
                            <input type="radio" class="form-check-input" name="sidebarsColor" value="chrome" id="sidebarsColor_chrome">
                            <label class="form-check-label" for="sidebarsColor_chrome">${t('chroom')}</label>
                        </div>
                           <div class="h6 fw-normal form-check">
                            <input type="radio" class="form-check-input" name="sidebarsColor" value="black" id="sidebarsColor_black">
                            <label class="form-check-label" for="sidebarsColor_black">${t('zwart')}</label>
                        </div>
                        <div class="h6 fw-normal form-check">
                            <input type="radio" class="form-check-input" name="sidebarsColor" value="luxury" id="sidebarsColor_luxury">
                            <label class="form-check-label" for="sidebarsColor_luxury">${t('zwart')} (${t('luxe')})</label>
                        </div>
                    </div>
                    <div class="col-12 col-md-auto">
                        <div class="fst-italic mb-2">${t('opties')}</div>
                        <div class="h6 fw-normal form-check">
                            <input type="checkbox" class="form-check-input" name="sidebarsMounting" id="sidebarsMounting">
                            <label class="form-check-label" for="sidebarsMounting">${t('montage')}</label>
                        </div>
                    </div>
                </div>`
        };
    
        accordions.sunvisorOptions = {
            checkbox: { id: 'sunvisor', name: 'sunvisor' },
            enabled: !!model.sunvisor,
            title: t('zonneklep'),
            options: ['sunvisorLight'],
            display: "d-block",
            code: `
                <div class="row m-0 p-0 pb-xxl-4 pb-xl-4 pb-3">
                    <div class="col-12 col-md-auto">
                        <div class="fst-italic mb-2">${t('opties')}</div>
                        <div class="h6 fw-normal form-check">
                            <input type="checkbox" class="form-check-input" name="sunvisorLight" id="sunvisorLight">
                            <label class="form-check-label" for="sunvisorLight">${t('ledverlichting')}</label>
                        </div>
                        <div class="h6 fw-normal form-check">
                            <input type="checkbox" class="form-check-input" name="sunvisorMounting" id="sunvisorMounting">
                            <label class="form-check-label" for="sunvisorMounting">${t('montage')}</label>
                        </div>
                    </div>
                </div>`
        };
    */

    return { accordions };
}
