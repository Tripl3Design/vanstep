//price & articleList
function pricing(model) {
    let totalPrice = 0;

    const category = model.upholstery.category;

    let price = ALLCOMPONENTS.elements[model.type].prices[category];
    if (model.upholsteryDuotone != null && model.type != 'art9085110') {
        let additionalPrice = ALLCOMPONENTS.elements[model.type].prices.A18.fabric;
        totalPrice += additionalPrice;
    }
    totalPrice += price;
    console.log(totalPrice);

    const priceElement = document.querySelector('.productInfoPrice');

    if (priceElement) {

        priceElement.textContent = '€ ' + totalPrice.toFixed(0) + ',-';

        if (parser.getDevice().type != 'mobile') {
            priceElement.innerHTML = '<div id="totalPrice" class="h5 fw-bold">€ ' + totalPrice.toFixed(0) + ',-</div>';
        } else {
            priceElement.innerHTML = '<div id="totalPrice" class="mt-3"><span class="h4 fw-bold text-decoration-none">€ ' + totalPrice.toFixed(0) + ',-</div>';
        }
    }
}