const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const axios = require('axios');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json()); 


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
 
            return res.redirect(configuratorUrl);
        }
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








// Mollie API-gegevens
const MOLLIE_CLIENT_ID = 'app_R9oCYGHTeYkhaSKS5MmerBxZ';
const MOLLIE_CLIENT_SECRET = 'aqRTUJGpNgkdPHhvpMJAw9FktH43DzSurQS2Tnjy';
const REDIRECT_URI = 'https://vanwoerdenwonen.nl'; // URL naar waar je wilt redirecten na autorisatie

// Route om Mollie autorisatie te starten
app.get("/auth/mollie", (req, res) => {
    const scope = "payments"; // Voeg de juiste scopes toe
    const url = `https://www.mollie.com/oauth/authorize?client_id=${MOLLIE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}`;
    res.redirect(url);
});

// Route om het access token op te halen
app.get("/auth/mollie/callback", async (req, res) => {
    const authCode = req.query.code;

    if (authCode) {
        try {
            const tokenResponse = await axios.post('https://api.mollie.com/oauth/token', null, {
                params: {
                    grant_type: 'authorization_code',
                    code: authCode,
                    client_id: MOLLIE_CLIENT_ID,
                    client_secret: MOLLIE_CLIENT_SECRET,
                    redirect_uri: REDIRECT_URI,
                },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            const accessToken = tokenResponse.data.access_token;
            // Bewaar het access token in de database, of gebruik het verder
            res.send(`Access token: ${accessToken}`);
        } catch (error) {
            console.error('Error fetching access token:', error.response.data);
            res.status(500).send('Error fetching access token');
        }
    } else {
        res.status(400).send('Authorization code is missing');
    }
});

// Betaling maken
app.post("/payments", async (req, res) => {
    const { amount, description, accessToken } = req.body;

    try {
        const paymentResponse = await axios.post('https://api.mollie.com/v2/payments', {
            amount: {
                currency: 'EUR',
                value: amount,
            },
            description: description,
            redirectUrl: 'https://vanwoerdenwonen.nl',
            webhookUrl: 'JOUW_WEBHOOK_URL',
        }, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        res.json(paymentResponse.data);
    } catch (error) {
        console.error('Error creating payment:', error.response.data);
        res.status(500).send('Error creating payment');
    }
});

// Expose the API as a Cloud Function
exports.api = functions.https.onRequest(app);
