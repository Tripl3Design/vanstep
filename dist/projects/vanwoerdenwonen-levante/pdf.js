// Gebruik dit in een <input type="file"> in HTML
document.getElementById('fileInput').addEventListener('change', convertToBase64);

function createPdf(model, mainImage, title, fsid) {
    const configuratorUrl = `${document.referrer}?brand=${brand}&product=${product}&fsid=${fsid}`;
    const now = new Date();
    const padToTwoDigits = (number) => (number < 10 ? '0' + number : number);
    // Datum en tijd formatteren als DD-MM-YYYY_HH-MM
    const day = padToTwoDigits(now.getDate());
    const month = padToTwoDigits(now.getMonth() + 1); // Maanden zijn 0-indexed
    const year = now.getFullYear();
    const hours = padToTwoDigits(now.getHours());
    const minutes = padToTwoDigits(now.getMinutes());

    const dateString = `${day}-${month}-${year}_${hours}-${minutes}`;

    const price = document.getElementById('totalPrice').textContent;

    let upholsteryTable = [
        [{ text: '', fontSize: 10}, { text: 'type', fontSize: 10, bold: true }, { text: 'collectie', fontSize: 10, bold: true }, { text: 'naam', fontSize: 10, bold: true },{ text: 'prijsgroep', fontSize: 10, bold: true },],
        [{ text: 'zitting en rug', fontSize: 10, bold: true }, { text: 'stof', fontSize: 10 }, { text: model.upholstery.type, fontSize: 10 }, { text: model.upholstery.name, fontSize: 10 }, { text: model.upholstery.pricegroup, fontSize: 10 }]
    ];

    if (model.upholsteryDuotone) {
        upholsteryTable.push(
            [{ text: 'achterkant rug', fontSize: 10, bold: true }, { text: 'stof', fontSize: 10 }, { text: model.upholsteryDuotone.type, fontSize: 10 }, { text: model.upholsteryDuotone.name, fontSize: 10}, { text: model.upholsteryDuotone.pricegroup, fontSize: 10 }]
        );
    }

    var docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 30, 30, 30],
        defaultStyle: {
            font: 'RobotoDefault',
        },

        content: [
            { image: mainImage, width: 210, absolutePosition: { x: 356, y: 30 } },
            { text: `${title}`, font: 'Poppins', fontSize: 24, characterSpacing: 1.5, color: '#292929', absolutePosition: { x: 28, y: 30 } },
            { text: 'Offerte', font: 'Poppins', fontSize: 26, characterSpacing: 1.5, color: '#dfdeda', absolutePosition: { x: 28, y: 60 } },
            {
                text: [
                    { text: 'Scan QR of ' },
                    { text: 'klik hier', link: configuratorUrl, decoration: 'underline' },
                    { text: ' om te configureren.' },
                ], lineHeight: 1.4, fontSize: 10, absolutePosition: { x: 130, y: 207 }
            },
            { qr: configuratorUrl, fit: 120, absolutePosition: { x: 28, y: 135 } },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }], margin: [0, 210, 0, 0]
            },
            { text: 'Type', bold: true, fontSize: 12, margin: [0, 15, 0, 5] },
            {
                layout: 'noBorders',
                table: {
                    headerRows: 0,
                    widths: [100, 'auto'],
                    body: [
                        [{ text: 'type', fontSize: 10, bold: true }, { text: `Evan`, fontSize: 10 }],
                        [{ text: 'artikelnummer', fontSize: 10, bold: true }, { text: `${model.type.substring(3)}`, fontSize: 10 }]
                    ]
                }, margin: [0, 5, 0, 0]
            },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }], margin: [0, 15, 0, 0]
            },
            { text: 'Afmetingen', bold: true, fontSize: 12, margin: [0, 15, 0, 5] },
            {
                layout: 'noBorders',
                table: {
                    headerRows: 0,
                    widths: [100, 'auto'],
                    body: [
                        [{ text: 'breedte', fontSize: 10, bold: true }, { text: `${ALLCOMPONENTS.elements[model.type].width} cm`, fontSize: 10 }],
                        [{ text: 'diepte', fontSize: 10, bold: true }, { text: `${ALLCOMPONENTS.elements[model.type].depth} cm`, fontSize: 10 }],
                        [{ text: 'hoogte', fontSize: 10, bold: true }, { text: `84 cm`, fontSize: 10 }]
                    ]
                }, margin: [0, 5, 0, 0]
            },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }], margin: [0, 15, 0, 0]
            },
            { text: 'Opties', bold: true, fontSize: 12, margin: [0, 15, 0, 5] },
            {
                layout: 'noBorders',
                table: {
                    headerRows: 0,
                    widths: [100, 'auto'],
                    body: [
                        [{ text: 'zithoogte', fontSize: 10, bold: true }, { text: `${model.seatHeight} cm`, fontSize: 10 }],
                        [{ text: 'voetenbank', fontSize: 10, bold: true }, { text: `${(model.footstool === true) ? 'ja' : 'nee'}`, fontSize: 10 }]
                    ]
                }, margin: [0, 5, 0, 0]
            },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }], margin: [0, 15, 0, 0]
            },
            { text: 'Bekleding', bold: true, fontSize: 12, margin: [0, 15, 0, 5] },
            {
                layout: 'noBorders',
                table: {
                    headerRows: 1, // ✅ Zet header row correct
                    widths: [100, 75, 75, 75, 75],
                    body: upholsteryTable
                },
                margin: [0, 5, 0, 0]
            },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }],
                margin: [0, 15, 0, 0]
            },
            {
                layout: 'noBorders',
                table: {
                    headerRows: 0,
                    widths: [100, 'auto'],
                    body: [
                        [{ text: 'Prijs :', fontSize: 12, bold: true }, { text: `${price}`, fontSize: 12, bold: true }],

                    ]
                }, margin: [0, 15, 0, 0]
            },
            {
                columns: [
                    {
                        width: 240,
                        alignment: 'left',
                        text: 'Deze offerte is gegenereerd door de TripleTise Configurator', link: 'http://tripledesign.nl', fontSize: 8
                    },
                    {
                        width: '*',
                        alignment: 'right',
                        text: { text: 'LOGO', fontSize: 30, bold: true }
                        
                        //svg: '<svg viewBox="0 0 197.4 57.2"><path class="st0" d="m20.9 19.4c-1.2-1.5-2.9-2.7-5.4-2.7-6.3 0-7.6 5.9-7.6 10.8 0 4.8 1.3 10.7 7.6 10.7 2.5 0 4.2-1.2 5.4-2.7 1.6-2.2 2.1-5.2 2.1-8s-0.4-5.9-2.1-8.1m4.3 22.9c-2 1.6-4.8 2.7-8.1 2.7-4 0-7.2-1.4-8.7-3.3v15.2h-8v-46h6.9l0.5 3.7c2-3.1 5.7-4.4 9.3-4.4 3.3 0 6 1.2 8 2.8 4 3.3 5.9 8.3 5.9 14.5 0.2 6.5-1.9 11.6-5.8 14.8m32-12.9-8.5 0.6c-2.5 0.2-4.8 1.6-4.8 4.4 0 2.6 2.3 4.2 4.8 4.2 5 0 8.5-2.7 8.5-7.6v-1.6zm6.7 15.3c-3.5 0-5.4-2.2-5.7-4.7-1.6 2.7-5.4 5-10.1 5-8 0-12.1-5-12.1-10.4 0-6.3 4.9-10 11.3-10.4l9.8-0.7v-2c0-3.1-1.1-5.3-5.7-5.3-3.8 0-5.9 1.6-6.1 4.8h-7.8c0.5-7.5 6.4-10.8 13.8-10.8 5.7 0 10.6 1.8 12.5 6.8 0.8 2.1 1 4.5 1 6.8v12.3c0 1.6 0.5 2.1 1.8 2.1 0.5 0 1-0.1 1-0.1v5.9c-1 0.4-1.8 0.7-3.7 0.7m34-3.5c-2.7 2.7-6.9 3.8-11.4 3.8-4.2 0-8-1.2-10.8-3.8-1.9-1.8-3.5-4.6-3.5-7.8h7.5c0 1.5 0.8 3.1 1.8 3.9 1.3 1 2.7 1.5 5 1.5 2.7 0 6.8-0.5 6.8-4.2 0-1.9-1.3-3.2-3.3-3.5-2.9-0.5-6.3-0.6-9.2-1.3-4.6-1-7.6-4.7-7.6-8.9 0-3.4 1.4-5.8 3.4-7.5 2.5-2.1 5.9-3.3 10.1-3.3 4 0 8 1.3 10.4 3.9 1.8 1.9 2.9 4.4 2.9 6.9h-7.6c0-1.3-0.5-2.3-1.4-3.1-1-1-2.7-1.6-4.4-1.6-1.2 0-2.3 0-3.5 0.5-1.4 0.5-2.6 1.8-2.6 3.5 0 2.4 2 3.1 3.8 3.3 3 0.4 3.8 0.5 7.1 1 5.3 0.8 9.1 4.2 9.1 9.4 0.2 3.2-0.9 5.6-2.6 7.3m22.1 3.5c-6.8 0-10.1-3.8-10.1-10.2v-17h-6.1v-6.6h6.1v-8.5l8-2v10.4h8.4v6.6h-8.4v16.3c0 2.6 1.2 3.7 3.7 3.7 1.6 0 3-0.1 5.2-0.3v6.8c-2.3 0.4-4.5 0.8-6.8 0.8m31.3-25.5c-1.1-1.2-2.9-2.1-5-2.1s-4 1-5 2.1c-1.9 2.1-2.4 5.3-2.4 8.4s0.5 6.3 2.4 8.4c1.1 1.2 2.9 2.1 5 2.1s4-1 5-2.1c1.9-2.1 2.4-5.3 2.4-8.4 0-3.2-0.5-6.3-2.4-8.4m6.6 20.6c-2.3 2.8-6.6 5.2-11.7 5.2-5 0-9.3-2.4-11.7-5.2-2.5-3.1-3.9-6.7-3.9-12.3 0-5.7 1.4-9.1 3.9-12.3 2.3-2.8 6.6-5.2 11.7-5.2 5 0 9.3 2.4 11.7 5.2 2.5 3.1 3.9 6.7 3.9 12.3 0 5.7-1.4 9.2-3.9 12.3m29.7-21.5c-1.1-1.2-2.7-1.9-5-1.9-2.5 0-4.4 1-5.6 2.6-1.2 1.5-1.7 3-1.7 5.2h14.4c-0.1-2.5-0.8-4.4-2.1-5.9m9.4 11.7h-22.3c-0.1 2.6 0.8 5 2.5 6.5 1.2 1.1 2.7 2 4.9 2 2.3 0 3.8-0.5 4.8-1.6 0.7-0.7 1.3-1.6 1.6-2.8h7.7c-0.2 2-1.6 4.6-2.8 6.1-2.8 3.3-7 4.7-11.2 4.7-4.6 0-7.9-1.6-10.5-4.1-3.3-3.2-5.1-7.9-5.1-13.3 0-5.3 1.6-10.1 4.8-13.4 2.5-2.6 6.1-4.2 10.6-4.2 4.9 0 9.4 2 12.2 6.1 2.5 3.7 3 7.4 2.9 11.6-0.1 0.2-0.1 1.7-0.1 2.4"/></svg>', width: 100, margin: [0, 0, 0, 0]
                    }
                ],
                columnGap: 100,
                margin: [0, 15, 0, 0]
            }
        ]
    }
    pdfMake.fonts = {
        Poppins: {
            normal: 'https://vanwoerdenwonen-levante.web.app/fonts/Poppins-Black.ttf',
            bold: 'https://vanwoerdenwonen-levante.web.app/fonts/Poppins-Black.ttf',
            tekst: 'https://vanwoerdenwonen-levante.web.app/fonts/Roboto-Light.ttf',
            //bold: 'https://vanwoerdenwonen-levante.web.app/fonts/Roboto-Light.ttf',
        },
        RobotoDefault: {
            normal: 'https://pastoe-amsterdammer.web.app/fonts/Roboto-Light.ttf',
            bold: 'https://pastoe-amsterdammer.web.app/fonts/Roboto-Medium.ttf'
            //italics: 'https://pastoe-amsterdammer.web.app/fonts/Roboto-Light.ttf',
            //bold: 'https://pastoe-amsterdammer.web.app/fonts/Roboto-Light.ttf',
        },
    }
    pdfMake.createPdf(docDefinition).download(`${title}_${dateString}`);
}