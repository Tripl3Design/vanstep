const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin'); // Voeg de juiste import voor firebase-admin toe
admin.initializeApp();  // Initialiseer de Firebase Admin SDK
const db = admin.firestore();  // Verbind met Firestore

const { createMollieClient } = require('@mollie/api-client');
const cors = require('cors');  // Importeer de CORS module
const corsHandler = cors({ origin: true });  // Hiermee staan we verzoeken van alle domeinen toe

const express = require('express');
const app = express();
app.use(express.json()); // Parse JSON payloads

// Access the Mollie API keys
//const mollieApiKey = "test_8GneksMmafeywsSH2MfnFrWdf9vRUC"; // test VanWoerdenWonen
const mollieApiKey = "live_q8hrsmSaU38bSctz52xdG5CA3p7VdN"; // live VanWoerdenWonen
//const mollieApiKey = "test_QrMUtevQVUnnxFUyWkmxWEpJNrxDNn"; // test TripleDesign
//const mollieApiKey = "live_AyQeAeswQTt57FUUWkEfSAcqHfVdES"; // live TripleDesign

// Initialize Mollie client
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

exports.mollieAuthRedirect = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const { amount, description, orderId } = req.body;

    if (!amount || !description || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Amount, description, orderId are required."
      });
    }

    const formattedAmount = parseFloat(amount).toFixed(2);

    try {
      const payment = await mollieClient.payments.create({
        amount: {
          currency: 'EUR',
          value: formattedAmount, // Het bedrag als string met twee decimalen
        },
        description: description,
        redirectUrl: 'https://vanwoerdenwonen-tripletise.web.app?betaling-geslaagd', // Waar de klant naartoe wordt gestuurd na de betaling
        webhookUrl: 'https://us-central1-vanwoerdenwonen-tripletise.cloudfunctions.net/mollieWebhook',
        metadata: {
          orderId: orderId,
        }
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

exports.saveOrUpdateOrder = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    const { orderID, orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({
        success: false,
        message: 'Ordergegevens zijn vereist'
      });
    }

    try {
      if (orderID) {
        const orderRef = db.collection('orders').doc(orderID);
        const orderDoc = await orderRef.get();

        if (orderDoc.exists) {
          await orderRef.update(orderData);

          return res.status(200).json({
            success: true,
            message: 'Order succesvol bijgewerkt!',
            orderID: orderID
          });
        } else {
          const newOrderRef = await db.collection('orders').add(orderData);

          return res.status(201).json({
            success: true,
            message: 'Order niet gevonden, nieuwe order aangemaakt!',
            orderID: newOrderRef.id
          });
        }
      } else {
        const newOrderRef = await db.collection('orders').add(orderData);

        return res.status(201).json({
          success: true,
          message: 'Nieuwe order succesvol aangemaakt!',
          orderID: newOrderRef.id
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het opslaan of bijwerken van de order.',
        error: error.message
      });
    }
  });
});

exports.mollieWebhook = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    console.log("Webhook payload:", req.body);

    // Valideer alleen de aanwezigheid van de transactie-ID
    const { id } = req.body;
    if (!id) {
      console.error("Transactie-ID ontbreekt in de payload");
      return res.status(400).json({
        success: false,
        message: 'Transactie-ID ontbreekt in de webhook-payload'
      });
    }

    try {
      // Haal de betalingsdetails op van Mollie
      const payment = await mollieClient.payments.get(id);

      console.log("Betalingsgegevens ontvangen:", payment);

      // Haal orderID en status uit de betalingen
      const orderID = payment.metadata.orderId; // Metadata bevat je orderID
      const paymentStatus = payment.status;    // Betaalstatus (bijv. "paid", "failed")

      if (!orderID) {
        console.error("OrderID ontbreekt in de betalingsmetadata");
        return res.status(400).json({
          success: false,
          message: 'Geen orderID gevonden in de betalingsmetadata'
        });
      }

      // Update de order in Firestore
      const orderRef = db.collection('orders').doc(orderID);
      const orderDoc = await orderRef.get();

      if (!orderDoc.exists) {
        console.error("Order niet gevonden in Firestore");
        return res.status(404).json({
          success: false,
          message: 'Order niet gevonden'
        });
      }

      const currentOrderData = orderDoc.data();

      // Update Firestore met de nieuwe status en Mollie-transactie-ID
      const updatedOrderData = {
        ...currentOrderData,
        paymentData: {
          ...currentOrderData.paymentData,
          status: paymentStatus,
          molliePaymentId: id
        },
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      await orderRef.update(updatedOrderData);

      res.status(200).json({
        success: true,
        message: 'Betaling succesvol verwerkt',
        orderID: orderID,
        paymentStatus: paymentStatus
      });
    } catch (error) {
      console.error("Fout bij het verwerken van de webhook:", error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het verwerken van de webhook',
        error: error.message
      });
    }
  });
});

// Nodemailer transport instellen
const transporter = nodemailer.createTransport({
  service: 'gmail',  // Aangezien je Google Workspace gebruikt
  auth: {
    user: 'boudewijn27@gmail.com', // Jouw Google Workspace e-mailadres
    pass: 'triple3Design!' // Gebruik een app-specifiek wachtwoord
  },
});

// Functie om een e-mail naar jezelf te sturen
exports.sendTestEmail = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      const mailOptions = {
        from: 'boudewijn27@gmail.com', // Jouw Google Workspace e-mailadres
        to: 'boudewijn@tripledesign.nl', // Je eigen e-mailadres
        subject: 'Test e-mail van Firebase Functions',
        text: 'Dit is een test e-mail om de functionaliteit van Nodemailer te verifiëren.',
      };

      // Verstuur de e-mail
      await transporter.sendMail(mailOptions);

      res.status(200).json({
        success: true,
        message: 'Test e-mail succesvol verzonden!',
      });
    } catch (error) {
      console.error('Fout bij het verzenden van de e-mail:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het verzenden van de test e-mail',
        error: error.message,
      });
    }
  });
});


/*
exports.getIssuers = functions.https.onRequest(async (req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Haal alle betaalmethoden op
      const methods = await mollieClient.methods.all();

      // Log de volledige response van de API
      console.log("Complete Mollie Methods Response:", JSON.stringify(methods, null, 2));

      if (!methods || methods.length === 0) {
        console.error("No payment methods returned from Mollie API.");
        return res.status(404).json({ error: "No methods found from Mollie API." });
      }

      // Zoek naar de iDEAL betaalmethode
      const idealMethod = methods.find(method => method.id === 'ideal');
      console.log("Found iDEAL Method:", idealMethod);

      if (!idealMethod) {
        console.error("iDEAL payment method not found.");
        return res.status(404).json({ error: "iDEAL method not found." });
      }

      const idealIssuers = idealMethod.issuers;
      console.log('Mollie Issuers:', idealIssuers);  // Log de issuers van de iDEAL methode

      // Als er geen issuers zijn, stuur een lege lijst terug
      if (!idealIssuers || idealIssuers.length === 0) {
        console.warn("No issuers found for iDEAL.");
        return res.status(200).json([]);  // Lege lijst als geen banken gevonden
      }

      // Stuur de issuers terug naar de frontend
      res.status(200).json(idealIssuers);
    } catch (error) {
      console.error("Fout bij ophalen van de betaalmethoden:", error);
      res.status(500).json({
        error: true,
        message: "Kon bankenlijst niet ophalen",
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
      redirectUrl: 'https://vanwoerdenwonen-tripletise.web.app?betaling-geslaagd',
      webhookUrl: 'https://us-central1-vanwoerdenwonen-tripletise.cloudfunctions.net/mollieWebhook'
    });

    const paymentUrl = payment.links.checkout.href;

    // Redirect de gebruiker naar het Mollie betaalscherm
    res.redirect(paymentUrl);
  } catch (error) {
    console.error("Error exchanging authorization code or creating payment:", error);
    res.status(500).send("Failed to exchange authorization code or create payment");
  }
});

exports.getMollieAuthUrl = functions.https.onRequest((req, res) => {
  const clientId = 'pfl_vKrpzVqBA2'; // Vervang door jouw Client ID
  const redirectUri = 'https://your-app.com/mollie-callback'; // Pas dit aan naar je eigen callback-URL
  const state = 'optional-custom-state'; // Optioneel: Gebruik dit voor extra beveiliging, zoals een gebruikers-ID

  const authUrl = `https://www.mollie.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=payments.read+payments.write+profile.read&state=${state}`;

  res.status(200).json({ authUrl });
});
*/

