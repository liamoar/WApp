
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const UserUsage = require('../models/UserUsage');
const {getBundleById} = require('../utils/bundles')
const {sendMessage} = require('../services/whatsappService');

async function handleSuccess(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).send('Missing session_id');

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== 'paid') {
      return res.status(400).send('Payment not completed');
    }

    const { phone, selectedBundleId, name } = session.metadata;
    const bundle = getBundleById(selectedBundleId); 
    
    if (!bundle) return res.status(400).send('Invalid bundle');

    const now = new Date();
    const expiryDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

     const updateData = {
      $inc: {
        messagesRemaining: bundle.messages,
        imagesRemaining: bundle.images
      },
      $push: {
        bundleHistory: {
          bundleId: bundle.id,
          purchaseDate: now,
          expiryDate,
          credits: {
            messages: bundle.messages,
            images: bundle.images
          }
        }
      },
      $set: {
        'conversationState.step': 'chat_active',
        'conversationState.lastPaymentDate': now,
        lastUpdated: now,
        name: name // Save user's name from metadata
      }
    };

    await UserUsage.updateOne({ phone }, updateData);

    // Send confirmation message
    await sendMessage(phone, 
      `🎉 Payment successful! You've received:\n` +
      `📝 ${bundle.messages} messages\n` +
      `🖼️ ${bundle.images} images\n\n` +
      `You can now continue chatting.`
    );

    return res.json("Purchased successfull");

  } catch (err) {
    console.error('Payment processing error:', err);
    return res.status(500).send('Error completing your purchase');
  }
}

async function handleRedirect(req, res){
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || !session.url) {
      return res.status(404).send('Invalid session ID');
    }
    // Redirect to Stripe hosted checkout page
    return res.redirect(session.url);
  } catch (err) {
    console.error('Stripe redirect error:', err);
    return res.status(500).send('Failed to redirect to payment page.');
  }
}
 

module.exports = {
  handleSuccess,
  handleRedirect
};
