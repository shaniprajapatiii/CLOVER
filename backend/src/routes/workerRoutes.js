const express = require('express');
const router = express.Router();
const { workerController } = require('../controllers/controllers');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/leaderboard', workerController.getLeaderboard);
router.get('/referrals', workerController.getReferralStats);
router.post('/kyc', workerController.submitKyc);
module.exports = router;
