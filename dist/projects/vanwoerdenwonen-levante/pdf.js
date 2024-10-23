function createPdf(model, mainImage, fsid) {
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
            font: 'HelveticaNeue'
        },

        content: [
            { image: mainImage, width: 210, absolutePosition: { x: 356, y: 30 } },
            //{ qr: `${link}`, fit: 100, absolutePosition: { x: 240, y: 30 } },
            { text: `LEVANTE`, fontSize: 24, characterSpacing: 1.5, color: '#292929', absolutePosition: { x: 28, y: 30 } },
            { text: 'OFFERTE', fontSize: 26, characterSpacing: 1.5, color: '#dfdeda', absolutePosition: { x: 28, y: 60 } },
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
            { text: 'elementen', bold: true, fontSize: 10, margin: [0, 15, 0, 5] },
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
                        svg: '<svg xmlns="http://www.w3.org/2000/svg" width="82" height="40" fill="none" viewBox="0 0 82 40"><path fill="#FFD43D" d="M73.365 19.71c0 2.904-2.241 5.31-5.27 5.31-3.03 0-5.228-2.406-5.228-5.31 0-2.905 2.199-5.312 5.228-5.312s5.27 2.407 5.27 5.311Z"></path><path fill="#FF0C81" d="M48.764 19.544c0 2.946-2.323 5.145-5.27 5.145-2.904 0-5.227-2.2-5.227-5.145 0-2.947 2.323-5.104 5.228-5.104 2.946 0 5.27 2.158 5.27 5.104Z"></path><path fill="#11EEFC" d="M20.074 25.02c3.029 0 5.27-2.406 5.27-5.31 0-2.905-2.241-5.312-5.27-5.312-3.03 0-5.228 2.407-5.228 5.311 0 2.905 2.199 5.312 5.228 5.312Z"></path><path fill="#171A26" d="M68.095 30.54c-6.307 0-11.12-4.897-11.12-10.872 0-5.934 4.855-10.83 11.12-10.83 6.349 0 11.162 4.938 11.162 10.83 0 5.975-4.855 10.871-11.162 10.871Zm0-5.52c3.03 0 5.27-2.406 5.27-5.31 0-2.905-2.24-5.312-5.27-5.312-3.029 0-5.228 2.407-5.228 5.311 0 2.905 2.199 5.312 5.228 5.312ZM43.08 40c-4.813 0-8.506-2.116-10.373-5.934l4.896-2.655c.913 1.784 2.614 3.195 5.394 3.195 3.486 0 5.85-2.448 5.85-6.473v-.374c-1.12 1.411-3.111 2.49-6.016 2.49-5.768 0-10.373-4.481-10.373-10.581 0-5.934 4.813-10.788 11.12-10.788 6.431 0 11.162 4.605 11.162 10.788v8.299C54.74 35.27 49.76 40 43.08 40Zm.415-15.311c2.946 0 5.27-2.2 5.27-5.145 0-2.947-2.324-5.104-5.27-5.104-2.905 0-5.228 2.158-5.228 5.104s2.323 5.145 5.228 5.145ZM20.074 30.54c-6.307 0-11.12-4.897-11.12-10.872 0-5.934 4.854-10.83 11.12-10.83 6.348 0 11.162 4.938 11.162 10.83 0 5.975-4.855 10.871-11.162 10.871Zm0-5.52c3.029 0 5.27-2.406 5.27-5.31 0-2.905-2.241-5.312-5.27-5.312-3.03 0-5.228 2.407-5.228 5.311 0 2.905 2.199 5.312 5.228 5.312ZM0 0h5.892v30H0V0ZM82 6.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z"></path></svg>',
                    }
                    ],
                columnGap: 196,
                margin: [0, 15, 0, 0]
            }
        ]
    }
    pdfMake.fonts = {
        HelveticaNeue: {
            normal: 'https://vanwoerdenwonen-levante.web.app/fonts/HelveticaNeueRoman.otf',
            bold: 'https://vanwoerdenwonen-levante.web.app/fonts/HelveticaNeueBold.otf'
            //italics: 'https://vanwoerdenwonen-levante.web.app/fonts/Roboto-Light.ttf',
            //bold: 'https://vanwoerdenwonen-levante.web.app/fonts/Roboto-Light.ttf',
        },
    }
    pdfMake.createPdf(docDefinition).download(`Van-Woerden-Wonen_Levante_${dateString}`);
}