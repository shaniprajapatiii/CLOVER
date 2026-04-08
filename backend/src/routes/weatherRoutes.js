// weatherRoutes.js
const express = require('express');
const router = express.Router();
const { weatherController } = require('../controllers/controllers');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/current', weatherController.getCurrentWeather);
router.get('/forecast', weatherController.getForecast);
router.get('/forecast/all-cities', weatherController.getForecastAllCities);
router.get('/cities', weatherController.getCities);
router.get('/reverse-geocode', weatherController.reverseGeocode);
router.get('/events', weatherController.getWeatherEvents);
router.post('/simulate', adminOnly, weatherController.simulateWeatherEvent);

module.exports = router;
