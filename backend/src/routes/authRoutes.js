// authRoutes.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, sendOtp, verifyOtp } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;
