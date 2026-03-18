// paymentRoutes.js
const express = require('express');
const r1 = express.Router();
const { paymentController } = require('../controllers/controllers');
const { protect } = require('../middleware/auth');
r1.use(protect);
r1.post('/initiate', paymentController.initiatePayment);
r1.post('/verify', paymentController.verifyPayment);
module.exports = r1;
