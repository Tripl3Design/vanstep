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
    console.log(totalPrice);

    document.getElementById('add-to-cart-button').addEventListener('click', () => {
        const { dataURL, blob } = mainModule.captureScreenshot();
        const product = {
            name: model.name,
            price: totalPrice,
            //imageUrl: 'https://vanwoerdenwonen-levante.web.app/projects/vanwoerdenwonen-levante/img/opstelling/art553.png'
            imageUrl: dataURL
        };

        // Stuur bericht naar de parent page om de sidebar te tonen
        parent.postMessage({ action: 'showSidebar' }, '*');

        // Stuur bericht om het product toe te voegen aan de winkelwagen
        parent.postMessage({
            action: 'addToCart',
            product: product
        }, '*');

        // Stuur bericht naar de parent page om de checkout-knop zichtbaar te maken
        parent.postMessage({ action: 'showCheckoutButton' }, '*');
    });

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