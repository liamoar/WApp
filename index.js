require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const Stripe = require('stripe');
const axios = require('axios');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// In-memory user state store for demo purposes
const userStates = {};

// Helper to send WhatsApp message via Gupshup
async function sendMessage(to, message) {
  try {
    await axios.post('https://api.gupshup.io/wa/api/v1/msg', {
      channel: 'whatsapp',
      source: '917834811114',
      destination: to,
      message: JSON.stringify({ type: 'text', text: message }),
      'src.name': 'TenantMange',
    }, {
      headers: {
        'apikey': process.env.GUPSHUP_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      }
    });
  } catch (err) {
    console.error('Error sending message:', err.response?.data || err.message);
  }
}

// Helper to send WhatsApp image via Gupshup
async function sendImage(to, imageUrl, caption = '') {
  try {
    await axios.post('https://api.gupshup.io/wa/api/v1/msg', {
      channel: 'whatsapp',
      source: '917834811114',
      destination: to,
      message: JSON.stringify({
        type: 'image',
        originalUrl: imageUrl,
        previewUrl: imageUrl,
        caption,
      }),
      'src.name': 'TenantMange',
    }, {
      headers: {
        'apikey': process.env.GUPSHUP_API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      }
    });
  } catch (err) {
    console.error('Error sending image:', err.response?.data || err.message);
  }
}

// Helper to send WhatsApp image via Gupshup
app.post('/webhook', async (req, res) => {
  const waPayload = req.body;

  // ✅ Handle sandbox/ping/payloads with no phone early
  const type = waPayload?.type;
  const payloadType = waPayload?.payload?.type;

  if (
    (type === 'user-event' && payloadType === 'sandbox-start') ||
    type === 'ping' ||
    type === 'message-event'
  ) {
    return res.status(200).send('Webhook verified');
  }

  const { payload } = waPayload;
  const from = payload.sender?.phone || payload.source;
  const msg = payload.payload?.text?.trim().toLowerCase();

  if (!from || !msg) return res.sendStatus(400);
  if (type !== 'message') return res.send('Ignoring non-message');

  const optInTrigger = 'proxy tenantmange';
  const isNewUser = !userStates[from];

  if (isNewUser && msg === optInTrigger) {
    userStates[from] = { step: 'asking_name' };
    await sendMessage(from, "Hi welcome! What should we call you?");
    return res.sendStatus(200);
  }

  const state = userStates[from];
  if (!state) {
    await sendMessage(from, "Please type 'PROXY Tenantmanage' to start.");
    return res.sendStatus(200);
  }

  if (state.step === 'asking_name') {
    state.name = msg;
    state.step = 'q1';
    await sendMessage(from, `Great ${state.name}! What kind of girl do you like?`);
    return res.sendStatus(200);
  }

  if (state.step === 'q1') {
    state.q1 = msg;
    state.step = 'q2';
    await sendMessage(from, "Cool! What is your ideal date type?");
    return res.sendStatus(200);
  }

  if (state.step === 'q2') {
    state.q2 = msg;
    state.step = 'preview_offer';
    await sendMessage(from, "Would you like to see some pictures?");
    return res.sendStatus(200);
  }

  if (state.step === 'preview_offer') {
    if (msg === 'yes') {
      await sendImage(
        from,
        'https://images.unsplash.com/photo-1647724065024-0389996ac3bf?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'Here is your preview'
      );
      await sendMessage(from, "Want to unlock the full image?");
      state.step = 'waiting_payment';
    } else {
      await sendMessage(from, "Okay, let us know if you change your mind!");
      delete userStates[from];
    }
    return res.sendStatus(200);
  }

  if (state.step === 'waiting_payment') {
    if (msg === 'yes') {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: [{
            price: 'price_1RRtJKEDkL8cFxcyx8sa02yv',
            quantity: 1,
          }],
          success_url: process.env.DOMAIN + '/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: process.env.DOMAIN+ '/cancel',
          metadata: {
            phone: from,
            name: state.name,
            q1: state.q1,
            q2: state.q2,
          }
        });
        const shortLink = `${process.env.DOMAIN}/pay/${session.id}`;
        await sendMessage(from, `Unlock your match here:\n🔗 ${shortLink}`);
        state.step = 'sent_payment_link';
        return res.sendStatus(200);
      } catch (err) {
        console.error('Stripe error:', err);
        await sendMessage(from, 'Oops, something went wrong creating your checkout session.');
        return res.sendStatus(500);
      }
    }
  }

  await sendMessage(from, 'You already have a payment link, please complete your purchase.');
  return res.sendStatus(200);
});

app.get('/success', async (req, res) => {
  const session_id = req.query.session_id;
  if (!session_id) return res.status(400).send('Missing session_id');

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const phone = session.metadata?.phone;
      if (phone) {
        await sendMessage(phone, '✅ Payment successful! you have unlocked the image:');
        await sendImage(phone, 'https://images.unsplash.com/photo-1631947430066-48c30d57b943?q=80&w=2032&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D');
      }
      return res.redirect('https://talksy.co/');
    } else {
      return res.status(400).send('Payment not completed.');
    }
  } catch (err) {
    console.error('Stripe session error:', err);
    return res.status(500).send('Internal server error.');
  }
});

app.get('/pay/:sessionId', async (req, res) => {
  const sessionId = req.params.sessionId;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || !session.url) {
      return res.status(404).send('Invalid session ID');
    }
    return res.redirect(session.url);
  } catch (err) {
    console.error('Stripe redirect error:', err);
    return res.status(500).send('Failed to redirect to payment page.');
  }
});

app.listen(PORT, () => {
  console.log('Server running on port', PORT);
});
