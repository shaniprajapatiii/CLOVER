const express = require('express');
const router = express.Router();
const { submitClaim, getMyClaims, getClaimById, getClaimStats, getAllClaims, reviewClaim, processPayout } = require('../controllers/claimController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/stats/summary', getClaimStats);
router.get('/', getMyClaims);
router.post('/', submitClaim);
router.get('/admin/all', adminOnly, getAllClaims);
router.get('/:id', getClaimById);
router.patch('/:id/review', adminOnly, reviewClaim);
router.patch('/:id/payout', adminOnly, processPayout);

module.exports = router;
