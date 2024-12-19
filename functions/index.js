const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

const { createMollieClient } = require('@mollie/api-client');
const cors = require('cors');  // Importeer de CORS module
const corsHandler = cors({ origin: true });  // Hiermee staan we verzoeken van alle domeinen toe

const express = require('express');
const app = express();
app.use(express.json()); // Parse JSON payloads


// Access the Mollie API keys
const mollieApiKey = "test_QrMUtevQVUnnxFUyWkmxWEpJNrxDNn";

// Initialize Mollie client
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

exports.mollieAuthRedirect = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    console.log("mollieAuthRedirect function triggered.");

    const { amount, description, orderId } = req.body;
    if (!amount || !description || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Amount, description, and orderId are required."
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