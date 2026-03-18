// weatherRoutes.js
const express = require('express');
const router = express.Router();
const { weatherController } = require('../controllers/controllers');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/current', weatherController.getCurrentWeather);
router.get('/events', weatherController.getWeatherEvents);
router.post('/simulate', adminOnly, weatherController.simulateWeatherEvent);

module.exports = router;
