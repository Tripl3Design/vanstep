// Global variable to hold the current model configuration
let currentConfiguredModel = {};

/**
 * Calculates the total price based on the selected model options.
 * @param {object} model - The configuration object for the van.
 */
function pricing(model) {
    // Store the latest model configuration globally for other functions to use.
    currentConfiguredModel = model;

    let totalPrice = 0;
    const basePrice = ALLCOMPONENTS.basePrice || 0;
    totalPrice += basePrice;

    // Add price for vanstep if selected
    if (model.vanstep) {
        totalPrice += ALLCOMPONENTS.accessories.vanstep.price || 0;

        // Add price for towbar if selected
        if (model.vanstep.towbar) {
            totalPrice += ALLCOMPONENTS.accessories.vanstep.options.towbar.price || 0;
        }
        // Add price for reverse lights if selected
        if (model.vanstep.reverseLights) {
            totalPrice += ALLCOMPONENTS.accessories.vanstep.options.reverseLights.price || 0;
        }
    }

    // Add price for sidebars if selected
    if (model.sidebars) {
        totalPrice += ALLCOMPONENTS.accessories.sidebars.price || 0;
    }

    // Add price for stair if selected
    if (model.stair) {
        totalPrice += ALLCOMPONENTS.accessories.stair.price || 0;
    }

    // Add price for sunvisor if selected
    if (model.sunvisor) {
        totalPrice += ALLCOMPONENTS.accessories.sunvisor.price || 0;
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
