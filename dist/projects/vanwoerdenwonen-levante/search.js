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
async function showSearchImages(modelFromSearch) {
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



    let randomColorGroupIndex = Math.floor(Math.random() * modelFromSearch.color.length);
    let attemptsForColor = 0;
    const maxAttemptsForColor = modelFromSearch.color.length;
    const chosenColors = [];
    let randomUpholsteryColor;

    while (attemptsForColor < maxAttemptsForColor) {
        if (!chosenColors.includes(randomColorGroupIndex)) {
            let colorGroup = ALLCOLORS.upholsteries.filter(color => color.colorGroup === modelFromSearch.color[randomColorGroupIndex]);
            console.log(colorGroup);
            if (colorGroup.length > 0) {
                chosenColors.push(randomColorGroupIndex);

                const randomColorInGroupIndex = Math.floor(Math.random() * colorGroup.length);
                const randomColorGroup = colorGroup[randomColorInGroupIndex].colorHex;
                console.log(randomColorInGroupIndex);

                randomUpholsteryColor = {
                    hexColor: randomColorGroup,
                    type: 'adore',

                    path: `https://${brand}-${product}.web.app/projects/${brand}-${product}/Textures/${colorGroup[randomColorInGroupIndex].colorPath}`,
                };

                console.log("Chosen Color:", randomUpholsteryColor);

                break;
            }
        }

        randomColorGroupIndex = (randomColorGroupIndex + 1) % modelFromSearch.color.length;
        attemptsForColor++;

        if (attemptsForColor === modelFromSearch.color.length) {
            console.log("No colors available in any color group.");
            document.getElementById('searchTitle').textContent = 'No products available in the choosen color(s)';
            break;
        }
    }

    const model = {
       
        //width: randomItem.width,
        background: { original: "d4d4d4" },
        type: randomItem.id,
        seatHeight: 44,
        legs: "legsStraight",
        //upholstery: randomUpholsteryColor
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

    //pricing(model);
}
