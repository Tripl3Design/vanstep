// Global variable to hold the current model configuration
let currentConfiguredModel = {};

// --- PRICING CONFIGURATION ---
window.PRICING_CONFIG = {
    basePrice: 0,
    van: {
        brand_surcharge: 95, // Volkswagen, MAN
        mercedes_l1: 151,
        mercedes_fwd: 151,
        drw: 137
    },
    vanstep: {
        base: 643,
        base_towbar: 705,
        color_surcharge: 287,
        lights: 200,
        mounting: 260,
        towbar: {
            inspection: 1150, // Omkeuren
            standard: 440,
            catchJaw: 500,
            variobloc: 213
        }
    },
    sidebars: {
        chrome: 550,
        black: 650,
        luxury: 750,
        mounting: 75
    },
    sunvisor: {
        standard: 365,
        led: 635,
        mounting: 115
    }
    ,
    stair: {
        small: 875,
        large: 925,
        mounting: 150
    }
};

/**
 * Calculates the total price based on the selected model options.
 * @param {object} model - The configuration object for the van.
 */
function pricing(model) {
    // Store the latest model configuration globally for other functions to use.
    currentConfiguredModel = model;
    const P = window.PRICING_CONFIG; // Short alias

    let totalPrice = 0;
    const basePrice = P.basePrice || 0;
    totalPrice += basePrice;

    // Van Surcharges
    if (model.van) {
        if (model.van.brand === 'volkswagen' || model.van.brand === 'man') {
            totalPrice += P.van.brand_surcharge;
        }
        if (model.van.brand === 'mercedes') {
            if (model.van.lenght === 'L1') totalPrice += P.van.mercedes_l1;
            if (model.van.drive === 'fwd') totalPrice += P.van.mercedes_fwd;
        }
        if (model.van.rearWheel === 'drw') {
            totalPrice += P.van.drw;
        }
    }

    // Add price for vanstep if selected
    if (model.vanstep) {
        // Base price vanstep (met of zonder trekhaak voorbereiding)
        if (model.vanstep.towbar) {
            totalPrice += P.vanstep.base_towbar;
        } else {
            totalPrice += P.vanstep.base;
        }

        // Kleur toeslag
        if (model.vanstep.color.color === 'black' || model.vanstep.color.color === 'blackSanded') {
            totalPrice += P.vanstep.color_surcharge;
        }

        // Verlichting
        if (model.vanstep.lights) {
            totalPrice += P.vanstep.lights;
        }

        // Montage Vanstep
        if (model.vanstep.mounting) {
            totalPrice += P.vanstep.mounting;
        }

        // Add price for towbar if selected
        if (model.vanstep.towbar) {
            totalPrice += P.vanstep.towbar.inspection; // Omkeuren naar 3500kg

            if (model.vanstep.towbar.type === 'standard') totalPrice += P.vanstep.towbar.standard;
            if (model.vanstep.towbar.type === 'catchJaw') totalPrice += P.vanstep.towbar.catchJaw;
            if (model.vanstep.towbar.variobloc) totalPrice += P.vanstep.towbar.variobloc;
        }
    }

    // Add price for sidebars if selected
    if (model.sidebars) {
        if (model.sidebars.color === 'black') totalPrice += P.sidebars.black;
        else if (model.sidebars.color === 'luxury') totalPrice += P.sidebars.luxury;
        else totalPrice += P.sidebars.chrome; // Chrome/Standaard

        if (model.sidebars.mounting) {
            totalPrice += P.sidebars.mounting; // Montage Sidebars
        }
    }

    // Add price for sunvisor if selected
    if (model.sunvisor) {
        if (model.sunvisor.lights) totalPrice += P.sunvisor.led;
        else totalPrice += P.sunvisor.standard;

        if (model.sunvisor.mounting) {
            totalPrice += P.sunvisor.mounting; // Montage Sunvisor
        }
    }

    // Add price for stair if selected
    if (model.stair) {
        if (model.stair.height === 'H1') {
            totalPrice += P.stair.small;
        } else {
            totalPrice += P.stair.large;
        }

        if (model.stair.mounting) {
            totalPrice += P.stair.mounting;
        }
    }

    // --- ADD PRICING INFORMATION TO THE MODEL OBJECT ---
    model.pricing = { // Rond de totaalprijs af op hele euro's
        totalPrice: Math.round(totalPrice),
        currency: 'EUR'
    };

    updatePriceDisplay(Math.round(totalPrice)); // Rond de weergegeven prijs ook af
}

/**
 * Updates the price display in the HTML.
 * @param {number} totalPrice - The calculated total price.
 */
function updatePriceDisplay(totalPrice) {
    const priceElements = document.querySelectorAll('.productInfoPrice');
    if (priceElements.length > 0) {
        const priceHTML = `
            <div class="h5 fw-bold"> <!-- De prijs wordt hier al afgerond door de aanroep van updatePriceDisplay -->
                <span id="totalPrice">€ ${totalPrice},-</span>
            </div>
        `;
        priceElements.forEach(el => {
            el.innerHTML = priceHTML;
        });
    } else {
        console.warn("Element with class 'productInfoPrice' not found.");
    }
}

/**
 * Handles the click event for the 'Add to Cart' button.
 */
function handleAddToCartClick() {
    if (!mainModule || typeof mainModule.captureScreenshot !== 'function') {
        console.error("mainModule or captureScreenshot function is not available.");
        return;
    }

    const { dataURL } = mainModule.captureScreenshot();
    const product = {
        model: currentConfiguredModel, // Use the globally stored model
        price: currentConfiguredModel.pricing.totalPrice,
        imageUrl: dataURL
    };

    // Communicate with the parent window
    parent.postMessage({ action: 'showSidebar' }, '*');
    parent.postMessage({ action: 'addToCart', product: product }, '*');
    parent.postMessage({ action: 'showCheckoutButton' }, '*');
}

// --- INITIALIZE EVENT LISTENERS ONCE ---
// We use DOMContentLoaded to ensure the button exists before adding a listener.
document.addEventListener('DOMContentLoaded', () => {
    // Use event delegation for dynamically added buttons if necessary,
    // but for now, we find them on load.
    const addToCartButton = document.getElementById('add-to-cart-button');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', handleAddToCartClick);
    } else {
        // This might not be an error if the button is only for a specific view (e.g., desktop/mobile)
        console.log("Element with ID 'add-to-cart-button' not found on initial load. This might be expected.");
    }
});
