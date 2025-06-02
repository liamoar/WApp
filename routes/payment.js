const express = require('express');
const router = express.Router();
const {handleSuccess, handleRedirect} = require('../controllers/paymentController');

router.get('/success',handleSuccess );
router.get('/pay/:sessionId', handleRedirect);

module.exports = router;
