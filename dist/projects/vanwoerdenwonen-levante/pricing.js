//price & articleList
function pricing(model) {
    let totalPrice = 0;

    const pricegroup = model.upholstery.pricegroup;
    let price = ALLCOMPONENTS.elements[model.type].prices[pricegroup];

    if (model.upholsteryDuotone != null && model.type != 'art9085110') {
        let additionalPrice = ALLCOMPONENTS.elements[model.type].prices.A18.fabric;
        totalPrice += additionalPrice;
    }

    if (model.footstool == true) {
        let footstoolPrice = ALLCOMPONENTS.elements.art9085110.prices[pricegroup];
        totalPrice += footstoolPrice;
    }

    totalPrice += price;

    // Globale variabelen om prijs en model op te slaan
    currentModel = model;
    currentTotalPrice = totalPrice;

    document.getElementById('add-to-cart-button').addEventListener('click', handleAddToCartClick, { once: true });

    const priceElement = document.querySelector('.productInfoPrice');
    if (priceElement) {
        priceElement.textContent = '€ ' + totalPrice.toFixed(0) + ',-';
        if (parser.getDevice().type != 'mobile') {
            priceElement.innerHTML = '<div id="totalPrice" class="h5 fw-bold">€ ' + totalPrice.toFixed(0) + ',-</div>';
        } else {
            priceElement.innerHTML = '<div id="totalPrice"><span class="material-symbols-outlined align-middle">shopping_cart </span>&nbsp;&nbsp;&nbsp;€ ' + totalPrice.toFixed(0) + ',-</div>';
        }
    }
}

function handleAddToCartClick() {
    const { dataURL, blob } = mainModule.captureScreenshot();
    const product = {
        model: currentModel, // Gebruik een globale of externe referentie
        price: currentTotalPrice, // Gebruik globale of externe referentie
        imageUrl: dataURL
    };

    parent.postMessage({ action: 'showSidebar' }, '*');
    parent.postMessage({ action: 'addToCart', product: product }, '*');
    parent.postMessage({ action: 'showCheckoutButton' }, '*');

    document.getElementById('add-to-cart-button').removeEventListener('click', handleAddToCartClick);
}

