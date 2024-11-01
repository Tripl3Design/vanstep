const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));

// Route voor Open Graph pagina
app.get('/:id', async (req, res) => {
    const docRef = db.collection('clientModels').doc(req.params.id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
        const data = docSnap.data();

        // Controleer of de gebruiker vanuit WhatsApp komt
        const currentUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        const isFromWhatsApp = currentUrl.includes('cloudfunctions');

        if (isFromWhatsApp) {
            // Als de gebruiker van WhatsApp komt, bouw de configurator-URL op
            const fsid = req.params.id; // Gebruik de id van de parameter als fsid
            const configuratorUrl = `${data.from}?brand=${data.brand}&product=${data.product}&fsid=${fsid}`;
console.log(configuratorUrl);
            // Redirect naar de configurator-URL
            return res.redirect(configuratorUrl);
        }

        // Standaard Open Graph HTML genereren
        res.send(`
            <html>
                <head prefix="og: https://ogp.me/ns#">
                    <meta property="og:title" content="${data.product} Configurator">
                    <meta property="og:description" content="Bekijk mijn configurator design!">
                    <meta property="og:image" content="${data.imageUrl}">
                    <meta property="og:url" content="${req.protocol}://${req.get('host')}/${req.params.id}">
                    <meta property="og:type" content="website">
                </head>
                <body>
                    <h1>${data.product} Configurator</h1>
                    <img src="${data.imageUrl}" alt="Configurator Screenshot">
                </body>
            </html>
        `);
    } else {
        res.status(404).send('Document niet gevonden');
    }
});

// Expose the API as a Cloud Function
exports.api = functions.https.onRequest(app);
