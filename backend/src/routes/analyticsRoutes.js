const express = require('express');
const router = express.Router();
const { analyticsController } = require('../controllers/controllers');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/dashboard', analyticsController.getDashboardStats);
router.get('/earnings', analyticsController.getEarningsProtected);
router.get('/admin', adminOnly, analyticsController.getAdminAnalytics);

module.exports = router;
