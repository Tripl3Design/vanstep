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

    var docDefinition = {
        pageSize: 'A4',
        pageOrientation: 'portrait',
        pageMargins: [30, 30, 30, 30],
        defaultStyle: {
            font: 'Poppins'
        },

        content: [
            { image: mainImage, width: 210, absolutePosition: { x: 356, y: 30 } },
            { text: `${title}`, fontSize: 24, characterSpacing: 1.5, color: '#292929', absolutePosition: { x: 28, y: 30 } },
            { text: 'Offerte', fontSize: 26, characterSpacing: 1.5, color: '#dfdeda', absolutePosition: { x: 28, y: 60 } },
            {
                layout: 'noBorders',
                absolutePosition: { x: 28, y: 200 },
                table: {
                    headerRows: 0,
                    widths: [100, 'auto'],
                    body: [
                        //[{ text: 'COMBINATION', bold: true, fontSize: 10 }, `${(document.querySelector('.productInfoName').textContent) + ' ' + document.getElementById(model.type).value}`],
                       // [{ text: 'configurator', bold: true, characterSpacing: 0.8, fontSize: 10 }, { text: `naar configurator`, fontSize: 10, link: `${link}` }],
                        { text: 'prijs', bold: true, characterSpacing: 0.8, fontSize: 14 }, { text: `${document.getElementById('totalPrice').textContent}`, fontSize: 14 }
                       
                    ]
                }, margin: [0, 30, 0, 0]
            },
            {
                text: [
                    { text: 'Scan QR of ' },
                    { text: 'klik hier', link: configuratorUrl, decoration: 'underline' },
                    { text: ' om te configureren.' },
                ], lineHeight: 1.4, fontSize: 10, absolutePosition: { x: 110, y: 215 }
            },
            { qr: configuratorUrl, fit: 80, absolutePosition: { x: 28, y: 155 } },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }], margin: [0, 180, 0, 0]
            },
            { text: 'type', bold: true, fontSize: 10, margin: [0, 15, 0, 5] },
            {
                layout: 'noBorders',
                table: {
                    headerRows: 0,
                    widths: [60, 'auto'],
                    body: [
                        [{ text: 'breedte', fontSize: 10 }, { text: `${model.width}`, fontSize: 10 }],
                        [{ text: 'diepte', fontSize: 10 }, { text: `${model.depth}`, fontSize: 10 }],
                        [{ text: 'hoogte', fontSize: 10 }, { text: `${model.height}`, fontSize: 10 }]
                    ]
                }, margin: [0, 5, 0, 10]
            },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }], margin: [0, 15, 0, 0]
            },
            { text: 'type', bold: true, fontSize: 10, margin: [0, 15, 0, 5] },
            {
                canvas: [{
                    type: 'line',
                    x1: 0, y1: 0,
                    x2: 536, y2: 0,
                    lineWidth: 0.2
                }], margin: [0, 15, 0, 0]
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
                        text: 'logo hier'
                    }
                    ],
                columnGap: 196,
                margin: [0, 15, 0, 0]
            }
        ]
    }
    pdfMake.fonts = {
        Poppins: {
            normal: 'https://vanwoerdenwonen-levante.web.app/fonts/Poppins-Black.ttf',
            bold: 'https://vanwoerdenwonen-levante.web.app/fonts/Poppins-Black.ttf'
            //italics: 'https://vanwoerdenwonen-levante.web.app/fonts/Roboto-Light.ttf',
            //bold: 'https://vanwoerdenwonen-levante.web.app/fonts/Roboto-Light.ttf',
        },
    }
    pdfMake.createPdf(docDefinition).download(`${title}_${dateString}`);
}