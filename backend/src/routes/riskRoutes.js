// riskRoutes.js
const express = require('express');
const router = express.Router();
const { riskController } = require('../controllers/controllers');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/assess', riskController.assessRisk);
module.exports = router;
