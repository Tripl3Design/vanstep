"use strict";

const brand = "vanwoerdenwonen";
const product = "levante";
const title = "evan";

var ALLCOLORS;
var ALLCOMPONENTS;
/*
var pricing = document.createElement('script');
pricing.src = `https://${brand}-${product}.web.app/projects/${brand}-${product}/pricing.js`;
document.head.appendChild(pricing);
*/

//let mainModule = null;



async function showSearchImages(modelFromSearch) {
        // Maak een screenshot en verkrijg zowel de dataURL als de Blob
        //const { dataURL, blob } = await mainModule.captureScreenshot();

         //Maak een tijdelijke URL voor de blob
        //const blobUrl = URL.createObjectURL(blob);

        const matchingItems = Object.entries(ALLCOMPONENTS.elements)
            .filter(([key, item]) =>
                item.width >= modelFromSearch.width.min &&
                item.width <= modelFromSearch.width.max
            )
            .map(([key, item]) => ({ id: key, ...item }));

        console.log("Gevonden items binnen breedte-range:");
        matchingItems.forEach(item => {
            console.log(`ID: ${item.id}, Width: ${item.width}`);
        });

        if (matchingItems.length === 0) {
            document.getElementById('searchTitle').textContent = 'Geen passende items gevonden.';
            return;
        }

        // Pak één willekeurig item uit de matches
        const randomIndex = Math.floor(Math.random() * matchingItems.length);
        const randomItem = matchingItems[randomIndex];

        console.log("Geselecteerd item:", randomItem);
        console.log("Geselecteerd item:", randomItem.id);
        console.log("Geselecteerd item:", randomItem.width);

        let attemptsForColor = 0;
        const chosenColors = [];
        let randomUpholsteryColor;

        // Filter geldige kleurgroepen die beschikbaar zijn in ALLCOLORS
        const validColorGroups = modelFromSearch.color.filter(colorName =>
            ALLCOLORS.upholsteries.some(u =>
                u.colorGroup.toLowerCase() === colorName.toLowerCase()
            )
        );

        // Als er GEEN geldige kleuren zijn, toon foutmelding
        if (validColorGroups.length === 0) {
            console.log("Geen kleuren beschikbaar in de opgegeven kleurgroepen.");
            document.getElementById('searchTitle').textContent = 'Geen producten beschikbaar in de gekozen kleur(en)';
        } else {
            const maxAttemptsForColor = validColorGroups.length;
            let randomColorGroupIndex = Math.floor(Math.random() * validColorGroups.length);

            while (attemptsForColor < maxAttemptsForColor) {
                if (!chosenColors.includes(randomColorGroupIndex)) {
                    const groupName = validColorGroups[randomColorGroupIndex];
                    const colorGroup = ALLCOLORS.upholsteries.filter(color =>
                        color.colorGroup.toLowerCase() === groupName.toLowerCase()
                    );

                    if (colorGroup.length > 0) {
                        chosenColors.push(randomColorGroupIndex);

                        const randomColorInGroupIndex = Math.floor(Math.random() * colorGroup.length);
                        const randomColor = colorGroup[randomColorInGroupIndex];

                        randomUpholsteryColor = {
                            hexColor: randomColor.colorHex,
                            type: randomColor.colorType,
                            path: randomColor.colorPath,
                            pricegroup: randomColor.colorPricegroup,
                        };

                        console.log("Gekozen kleur:", randomUpholsteryColor);
                        break;
                    }
                }

                randomColorGroupIndex = (randomColorGroupIndex + 1) % validColorGroups.length;
                attemptsForColor++;
            }
        }

        const model = {
            background: { original: "d4d4d4" },
            type: randomItem.id,
            seatHeight: 44,
            legs: "legsStraight",
            upholstery: randomUpholsteryColor
        };
        console.log(model);
        console.log(`https://${brand}-${product}.web.app?&data=${encodeURIComponent(JSON.stringify(model))}`);

        const btn = document.querySelector('.goToConfigurator');

        btn.addEventListener('click', (e) => {
            tripletiseModal(`${brand}-${product}.web.app?&data=${encodeURIComponent(JSON.stringify(model))}`);
        });

        document.querySelector('.productInfoBrand').src = `https://${brand}-${product}.web.app/img/logo_${brand}.svg`;
        document.querySelector('.productInfoFamily').textContent = title;
        document.querySelector('.productInfoType').textContent = model.type.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

        // Voeg de afbeelding in de DOM toe, met de blob URL
        //const productRenderImg = newResultSection.querySelector('.productRender');
        //productRenderImg.src = blobUrl;

        // copy of pricing.js NEED FIX
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
        // end of copy of pricing.js NEED FIX

        document.querySelector('.productInfoPrice').innerHTML = `<span class="original-price text-decoration-line-through">€ ${totalPrice.toFixed(0)}</span> nu <span id="totalPrice" class="discounted-price">€ ${discountedPrice.toFixed(0)}</span>`;

}
/*
//copy of settings.js
async function updateFeaturedModel(model) {
    import('https://vanwoerdenwonen-levante.web.app/projects/vanwoerdenwonen-levante/threeModel.js')
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
*/
