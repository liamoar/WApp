const { sendMessage } = require('../services/whatsappService');
const { getAllBundles, getBundleByIndex } = require('./bundles');
const { createCheckoutSession } = require('../services/paymentService');

/**
 * Step 1: Show all bundles to user
 */
async function showBundleOptions(phone) {
  const bundles = getAllBundles();

  let message = `💎 *Choose a plan to continue chatting:*\n\n`;
  bundles.forEach((bundle, i) => {
    message += `*${i + 1}. ${bundle.name}* - $${bundle.price_usd}\n_${bundle.description}_\n\n`;
  });
  message += `👉 Reply with *1*, *2*, etc. to select your bundle.`;

  await sendMessage(phone, message);
}

/**
 * Step 2: Handle selection and return Stripe checkout session
 */
async function handleBundleSelection(phone, selection, metadata = {}) {
  const index = parseInt(selection.trim(), 10);
  if (isNaN(index)) {
    await sendMessage(phone, "❌ Please reply with a number like *1* or *2* to choose a plan.");
    return null;
  }

  const bundle = getBundleByIndex(index);
  if (!bundle) {
    await sendMessage(phone, "❌ That option doesn’t exist. Please reply with a valid number from the list.");
    return null;
  }

  const session = await createCheckoutSession(phone, {
    ...metadata,
    selectedBundleId: bundle.id,
  }, bundle.stripe_price_id);
  console.log("checkout session");
  // Build a short link to your server that will redirect to Stripe checkout page
  const shortLink = `${process.env.DOMAIN}/pay/${session.id}`;
  await sendMessage(phone, `Click here to unlock me now and get full access to our private chat 🔥:\n\n 👉 ${shortLink}`);
  return session;
}

module.exports = {
  showBundleOptions,
  handleBundleSelection,
};
