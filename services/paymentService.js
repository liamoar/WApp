const Stripe = require('stripe');
const { STRIPE_SECRET_KEY, DOMAIN } = require('../config');

const stripe = Stripe(STRIPE_SECRET_KEY);

async function createCheckoutSession(from, metadata, priceId) {
  return await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${DOMAIN}/cancel`,
    metadata,
  });
}

async function retrieveSession(sessionId) {
  return await stripe.checkout.sessions.retrieve(sessionId);
}

module.exports = { createCheckoutSession, retrieveSession };
