require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  GUPSHUP_API_KEY: process.env.GUPSHUP_API_KEY,
  GUPSHUP_APP_NAME: process.env.GUPSHUP_APP_NAME,
  DOMAIN: process.env.DOMAIN,
  MONGODB_URI: process.env.MONGODB_URI,
};
