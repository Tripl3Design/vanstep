const functions = require('firebase-functions');
const { createMollieClient } = require('@mollie/api-client');
const cors = require('cors');  // Importeer de CORS module
const corsHandler = cors({ origin: true });  // Hiermee staan we verzoeken van alle domeinen toe


// Access the Mollie API key
const mollieApiKey = "test_QrMUtevQVUnnxFUyWkmxWEpJNrxDNn";

// Initialize Mollie client
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

/*
exports.mollieAuthRedirect = functions.https.onRequest((req, res) => {
  console.log("mollieAuthRedirect function triggered.");
  
  // Stel de vereiste parameters in
  const clientId = 'app_R9oCYGHTeYkhaSKS5MmerBxZ';
  const redirectUri = 'https://vanwoerdenwonen-levante.web.app';
  const responseType = 'code';
  const scope = 'payments.read customers.read';
  const state = 'your-state-param';
  
  // Bouw de Mollie OAuth URL handmatig
  const redirectUrl = `https://www.mollie.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&state=${state}`;
  
  console.log("Redirect URL: ", redirectUrl);
  
  try {
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error creating redirect URL:", error);
    res.status(500).send("Failed to create redirect URL");
  }
});
*/



exports.mollieAuthRedirect = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    console.log("mollieAuthRedirect function triggered.");

    // Haal het bedrag uit de request body
    const { amount, description } = req.body;

    // Zorg ervoor dat het bedrag een geldige string is met twee decimalen
    const formattedAmount = parseFloat(amount).toFixed(2); // Bijv. 10.00 of 15.99

    try {
      const payment = await mollieClient.payments.create({
        amount: {
          currency: 'EUR',
          value: formattedAmount, // Het bedrag als string met twee decimalen
        },
        description: description,
        redirectUrl: 'https://vanwoerdenwonen-levante.web.app/betaling-geslaagd', // Waar de klant naartoe wordt gestuurd na de betaling
        webhookUrl: 'https://vanwoerdenwonen-levante.web.app/betaling-webhook', // Waar Mollie je site informeert over de betaling
      });

      // Haal de URL van de betaling op
      const paymentUrl = payment.links.checkout.href;
      console.log("Payment URL:", paymentUrl); // Voeg een log toe om de URL te inspecteren

      // Stuur de paymentUrl terug naar de frontend
      res.status(200).json({ paymentUrl: paymentUrl });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({
        error: true,
        message: "Failed to create payment",
        details: error.message,
      });
    }
  });
});








exports.mollieOAuthCallback = functions.https.onRequest(async (req, res) => {
  console.log("mollieOAuthCallback function triggered.");
  
  const { code, state } = req.query;
  
  if (!code) {
    return res.status(400).send("Authorization code is missing");
  }

  try {
    // Gebruik de authorization code om toegangstokens te verkrijgen (zorg ervoor dat je deze stap implementeert)
    const tokens = await mollieClient.exchangeAuthorizationCode({
      code,
      redirectUri: 'https://vanwoerdenwonen-levante.web.app',
      clientId: 'app_R9oCYGHTeYkhaSKS5MmerBxZ',
      clientSecret: 'your-client-secret'  // Je client secret
    });

    console.log("Tokens received: ", tokens);
    
    // Maak de betaling aan met behulp van de Mollie API (gebruik de tokens indien nodig)
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: '10.00' // Bedrag van de betaling
      },
      description: 'Betaling voor Product X',
      redirectUrl: 'https://vanwoerdenwonen-levante.web.app/betaling-geslaagd',
      webhookUrl: 'https://vanwoerdenwonen-levante.web.app/betaling-webhook'
    });

    const paymentUrl = payment.links.checkout.href;

    // Redirect de gebruiker naar het Mollie betaalscherm
    res.redirect(paymentUrl);
  } catch (error) {
    console.error("Error exchanging authorization code or creating payment:", error);
    res.status(500).send("Failed to exchange authorization code or create payment");
  }
});

