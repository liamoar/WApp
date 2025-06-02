const UserUsage = require('../models/UserUsage');
const { sendMessage } = require('../services/whatsappService');

module.exports = async function checkCredits(req, res, next) {
  const { type, payload } = req.body;

  // ✅ Ignore irrelevant payloads
  if (
    (type === 'user-event' && payload?.type === 'sandbox-start') ||
    type === 'ping' ||
    type === 'message-event'
  ) {
    return res.status(200).send('Webhook verified');
  }

  const phone = payload.sender?.phone || payload.source;
  if (!phone) return res.status(400).send('❌ Missing phone number');

  req.phone = phone;
  const now = new Date();

  let user = await UserUsage.findOne({ phone });

  // 🆕 New user - save only once during creation
  if (!user) {
    console.log("🆕 New user detected:", phone);
    await sendMessage(phone, "Hi baby… 😘 I’ve been waiting for someone like you. What's your name ?");

    user = await UserUsage.create({
      phone,
      messagesRemaining: 3,
      imagesRemaining: 0,
      bundleHistory: [],
      conversationState: { 
        step: 'asking_q1',
        onBoardingCompleted: false
      },
      lastUpdated: new Date()
    });
    req.userUsage = user;
    return res.status(200).send('Onboarding started');
  }

  // For existing users
  let needsSave = false;
  
  // Check and clean bundles only if onboarding completed
  if (user.conversationState?.onBoardingCompleted) {
    const originalCount = user.bundleHistory.length;
    
    // Filter expired bundles
    user.bundleHistory = user.bundleHistory.filter(
      bundle => new Date(bundle.expiryDate) > now
    );
    
    // Recalculate credits if bundles changed
    if (user.bundleHistory.length !== originalCount) {
      user.messagesRemaining = user.bundleHistory.reduce(
        (sum, bundle) => sum + bundle.credits.messages, 0
      );
      user.imagesRemaining = user.bundleHistory.reduce(
        (sum, bundle) => sum + bundle.credits.images, 0
      );
      needsSave = true;
    }

    // Handle zero credits
    if (user.messagesRemaining <= 0 && user.conversationState.step !== 'post_purchase') {
      user.conversationState.step = 'waiting_payment';
      user.conversationState.awaitingBundleSelection = false;
      await sendMessage(phone, "🛑 You're out of credits!");
      needsSave = true;
    }
  }

  // Save only if something changed
  if (needsSave) {
    user.lastUpdated = new Date();
    await user.save();
  }

  req.userUsage = user;
  next();
};