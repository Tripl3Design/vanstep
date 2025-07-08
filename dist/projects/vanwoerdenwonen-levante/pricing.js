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

    // Calculate 10% off
    let discountedPrice = totalPrice * 0.9;

    // --- VOEG PRIJSINFORMATIE TOE AAN HET MODEL OBJECT ---
    // Voeg de originele en de afgeprijsde prijs toe aan het model object
    model.pricing = {
        originalPrice: totalPrice.toFixed(0),
        discountedPrice: discountedPrice.toFixed(0),
        currency: 'EUR' // Optioneel: voeg valuta toe
    };

    // Globale variabelen om prijs en model op te slaan (voor andere delen van je code)
    currentModel = model;
    currentTotalPrice = discountedPrice.toFixed(0);

    const addToCartButton = document.getElementById('add-to-cart-button');
    if (addToCartButton) {
        // Zorg ervoor dat de event listener maar één keer wordt toegevoegd,
        // of verwijder de oude eerst om dubbele listeners te voorkomen bij herhaaldelijk aanroepen van pricing().
        // De { once: true } optie is hier prima als de knop maar één keer wordt aangeklikt per pagina load.
        // Echter, als pricing vaker wordt aangeroepen (bij elke modelverandering),
        // kun je beter de listener verwijderen en opnieuw toevoegen.
        // Voorbeeld:
        addToCartButton.removeEventListener('click', handleAddToCartClick); // Verwijder eerdere
        addToCartButton.addEventListener('click', handleAddToCartClick);
    } else {
        console.error("Element met ID 'add-to-cart-button' niet gevonden!");
    }

    const priceElement = document.querySelector('.productInfoPrice');
    if (priceElement) {
        let priceHTML = ''; // Declareer priceHTML met let of const
        // If device is mobile, add the shopping cart icon
        if (windowHeight > windowWidth && (uap.getDevice().type === 'mobile' || uap.getDevice().type === 'tablet' || uap.getDevice().withFeatureCheck().type === 'tablet')) {
            priceHTML = `
                <div>
                    <span>bestel &nbsp;&nbsp;</span>
                    <span class="original-price-mobile" style="">€ ${totalPrice.toFixed(0)},-&nbsp;&nbsp;</span>
                    <span id="totalPrice" class="discounted-price">€ ${discountedPrice.toFixed(0)},-</span>
                </div>
            `;
        } else {
            priceHTML = `
                <div class="h5 fw-bold">
                    <span>van </span>
                    <span class="original-price" style="color: black;">€ ${totalPrice.toFixed(0)} ,- voor </span>
                    <span id="totalPrice" class="discounted-price">€ ${discountedPrice.toFixed(0)},-</span>
                </div>
            `;
        }

        // Insert the price HTML into the price element
        priceElement.innerHTML = priceHTML;
    }

    // CSS voor diagonale streep toevoegen
    // Let op: het dynamisch toevoegen van <style> tags per keer dat `pricing` wordt aangeroepen
    // kan leiden tot veel onnodige <style> tags in de <head>.
    // Overweeg om deze CSS in een apart CSS-bestand te plaatsen of eenmalig dynamisch toe te voegen.
    const originalPriceElement = document.querySelector('.original-price');
    const originalPriceElementMobile = document.querySelector('.original-price-mobile');

    // Dit blok kan vereenvoudigd worden. Je voegt dezelfde CSS toe voor desktop en mobile,
    // alleen met verschillende selectors. Better to manage this with proper CSS classes.
    if (originalPriceElement || originalPriceElementMobile) {
        const targetElement = originalPriceElement || originalPriceElementMobile;
        targetElement.style.display = 'inline-block';
        targetElement.style.position = 'relative';

        // Check if the style tag already exists to avoid duplicates
        if (!document.getElementById('price-strike-style')) {
            const style = document.createElement('style');
            style.id = 'price-strike-style'; // Voeg een ID toe om te controleren
            style.innerHTML = `
                .original-price::after,
                .original-price-mobile::after {
                    content: '';
                    position: absolute;
                    top: 10px;
                    /* Pas right aan per klasse als nodig */
                    width: 50%; /* Voor desktop */
                    height: 100%;
                    border-top: 2px solid red;
                    transform: rotate(-10deg);
                    transform-origin: 80 -80;
                }
                .original-price::after {
                    right: 65px; /* Specifiek voor desktop */
                }
                .original-price-mobile::after {
                    right: 10px; /* Specifiek voor mobile */
                    width: 80%; /* Grotere breedte voor mobile */
                }
            `;
            document.head.appendChild(style);
        }
    }
}

function handleAddToCartClick() {
    const { dataURL, blob } = mainModule.captureScreenshot();
    const product = {
        model: currentModel,
        price: currentTotalPrice,
        imageUrl: dataURL
    };

    parent.postMessage({ action: 'showSidebar' }, '*');
    parent.postMessage({ action: 'addToCart', product: product }, '*');
    parent.postMessage({ action: 'showCheckoutButton' }, '*');

    document.getElementById('add-to-cart-button').removeEventListener('click', handleAddToCartClick);
}
