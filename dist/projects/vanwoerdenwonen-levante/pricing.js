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

    document.getElementById('buyButton').addEventListener('click', () => {
        connectMollie(totalPrice, model.name);
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