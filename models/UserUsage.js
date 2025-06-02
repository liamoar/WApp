const mongoose = require('mongoose');

const BundleSchema = new mongoose.Schema({
  bundleId: String,
  purchaseDate: Date,
  expiryDate: Date,
  credits: {
    messages: Number,
    images: Number,
  },
});

const ConversationStateSchema = new mongoose.Schema({
  step: { type: String, default: 'start' },
  name: String,
  q1: String,
  q2: String,
  onBoardingCompleted : {type: Boolean, default: false},
  awaitingBundleSelection: { type: Boolean, default: false },
  stripeCheckoutSessionId : {type:String},
  lastPaymentDate : Date,
}, { _id: false });

const UserUsageSchema = new mongoose.Schema({
  phone: { type: String, unique: true, required: true },
  name: String,
  messagesRemaining: { type: Number, default: 0 },
  imagesRemaining: { type: Number, default: 0 },
  bundleHistory: [BundleSchema],
  lastUpdated: { type: Date, default: Date.now },
  conversationState: ConversationStateSchema,
});

module.exports = mongoose.model('UserUsage', UserUsageSchema);
