const axios = require('axios');
const { GUPSHUP_API_KEY } = require('../config');
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
      'src.name': 'CSMBot',
    }, { headers });
  } catch (err) {
    logger.error('Send Message Error:', err.response?.data || err.message);
  }
}

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
      'src.name': 'CSMBot',
    }, { headers });
     return res.status === 200;
  } catch (err) {
    logger.error('Send Image Error:', err.response?.data || err.message);
  }
}

module.exports = { sendMessage, sendImage };
