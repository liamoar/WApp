const axios = require('axios');
const { GUPSHUP_API_KEY,GUPSHUP_APP_NAME } = require('../config');
const logger = require('../config/logger');

const headers = {
  apikey: GUPSHUP_API_KEY,
  'Content-Type': 'application/x-www-form-urlencoded',
  'Cache-Control': 'no-cache',
};

async function sendMessage(to, text) {
  try {
    await axios.post('https://api.gupshup.io/wa/api/v1/msg', {
      channel: 'whatsapp',
      source: '917834811114',
      destination: to,
      message: JSON.stringify({ type: 'text', text }),
      'src.name': GUPSHUP_APP_NAME,
    }, { headers });
  } catch (err) {
    logger.error('Send Message Error:', err.response?.data || err.message);
  }
}

async function sendImage(to, imageUrl, caption = '') {
  try {
    const res = await axios.post('https://api.gupshup.io/wa/api/v1/msg', {
      channel: 'whatsapp',
      source: '917834811114',
      destination: to,
      message: JSON.stringify({
        type: 'image',
        originalUrl: imageUrl,
        previewUrl: imageUrl,
        caption,
      }),
      'src.name': GUPSHUP_APP_NAME,
    }, { headers });

    return res.status === 200;
  } catch (err) {
    console.log('Send Image Error:', err.response?.data || err.message);
    logger.error('Send Image Error:', err.response?.data || err.message);
    return false;
  }
}
module.exports = { sendMessage, sendImage };
