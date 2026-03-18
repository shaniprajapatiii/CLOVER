// notificationRoutes.js
const express = require('express');
const router = express.Router();
const { notificationController } = require('../controllers/controllers');
const { protect } = require('../middleware/auth');
router.use(protect);
router.get('/', notificationController.getNotifications);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', notificationController.markRead);
module.exports = router;
