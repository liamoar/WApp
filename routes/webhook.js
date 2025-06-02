const express = require('express');
const router = express.Router();

const checkCredits = require('../middleware/checkCredits');
const {handleWebhook} = require('../controllers/webhookController');

router.post('/', checkCredits, handleWebhook);

module.exports = router;
