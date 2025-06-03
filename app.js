const express = require('express');
const bodyParser = require('body-parser');
const webhookRoutes = require('./routes/webhook');
const paymentRoutes = require('./routes/payment');

const app = express();

app.use(bodyParser.json());

// Mount routes
app.use('/webhook', webhookRoutes);
app.use('/', paymentRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Running OK', timestamp: new Date() });
});


module.exports = app;
