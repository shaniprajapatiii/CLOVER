const express = require('express');
const router = express.Router();
const { adminController } = require('../controllers/controllers');
const { protect, adminOnly } = require('../middleware/auth');
router.use(protect, adminOnly);
router.get('/workers', adminController.getAllWorkers);
router.patch('/workers/:id/toggle', adminController.toggleWorkerStatus);
module.exports = router;
