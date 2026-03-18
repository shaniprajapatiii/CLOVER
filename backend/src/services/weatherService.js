const axios = require('axios');
const WeatherEvent = require('../models/WeatherEvent');
const logger = require('../utils/logger');

// Disruption thresholds
const THRESHOLDS = {
  extreme_heat: { temp: 42 },      // >42°C
  heavy_rain: { rainfall: 64.5 },  // >64.5mm/hr (IMD heavy rain)
  severe_pollution: { aqi: 301 },  // AQI > 301 (hazardous)
  flood: { rainfall: 115.6, description: 'flood' },
  cyclone: { windSpeed: 63 },      // >63 km/h
  dense_fog: { visibility: 200 },  // <200m visibility
  cold_wave: { temp: 10 }          // <10°C
};

const MOCK_WEATHER_BY_CITY = {
  mumbai: { temp: 35, humidity: 85, rainfall: 80, windSpeed: 25, visibility: 500, aqi: 120, description: 'heavy rain', weatherCode: 502 },
  delhi: { temp: 44, humidity: 30, rainfall: 0, windSpeed: 15, visibility: 2000, aqi: 350, description: 'haze', weatherCode: 721 },
  bangalore: { temp: 28, humidity: 65, rainfall: 10, windSpeed: 12, visibility: 8000, aqi: 85, description: 'light rain', weatherCode: 300 },
  chennai: { temp: 38, humidity: 75, rainfall: 5, windSpeed: 20, visibility: 3000, aqi: 95, description: 'haze', weatherCode: 721 },
  kolkata: { temp: 36, humidity: 80, rainfall: 45, windSpeed: 18, visibility: 1500, aqi: 130, description: 'moderate rain', weatherCode: 501 },
  hyderabad: { temp: 40, humidity: 45, rainfall: 2, windSpeed: 10, visibility: 5000, aqi: 110, description: 'sunny', weatherCode: 800 },
  pune: { temp: 32, humidity: 55, rainfall: 8, windSpeed: 14, visibility: 6000, aqi: 75, description: 'partly cloudy', weatherCode: 801 },
  ahmedabad: { temp: 45, humidity: 20, rainfall: 0, windSpeed: 20, visibility: 3000, aqi: 180, description: 'sunny', weatherCode: 800 },
  default: { temp: 33, humidity: 60, rainfall: 5, windSpeed: 12, visibility: 5000, aqi: 100, description: 'partly cloudy', weatherCode: 801 }
};

const getCityMock = (city) => {
  const key = city.toLowerCase().replace(/\s/g, '');
  for (const [k, v] of Object.entries(MOCK_WEATHER_BY_CITY)) {
    if (key.includes(k)) return { ...v };
  }
  return { ...MOCK_WEATHER_BY_CITY.default };
};

const fetchWeatherData = async (city, lat, lon) => {
  if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
    logger.info(`Using mock weather data for ${city}`);
    const mock = getCityMock(city);
    return { ...mock, source: 'mock' };
  }

  try {
    const url = `${process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5'}/weather`;
    const params = { appid: process.env.OPENWEATHER_API_KEY, units: 'metric', ...(lat && lon ? { lat, lon } : { q: city }) };
    const res = await axios.get(url, { params, timeout: 5000 });
    const d = res.data;
    return {
      temp: d.main.temp,
      feelsLike: d.main.feels_like,
      humidity: d.main.humidity,
      rainfall: d.rain ? (d.rain['1h'] || 0) * 10 : 0,
      windSpeed: d.wind.speed * 3.6,
      visibility: d.visibility,
      description: d.weather[0].description,
      weatherCode: d.weather[0].id,
      source: 'openweathermap'
    };
  } catch (err) {
    logger.warn(`Weather API failed for ${city}: ${err.message}. Using mock.`);
    return { ...getCityMock(city), source: 'mock' };
  }
};

const fetchAQIData = async (city, lat, lon) => {
  if (!process.env.OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
    return getCityMock(city).aqi;
  }
  try {
    const coords = lat && lon ? { lat, lon } : { lat: 28.6, lon: 77.2 }; // Default Delhi
    const res = await axios.get(`${process.env.AQI_API_URL}`, {
      params: { ...coords, appid: process.env.OPENWEATHER_API_KEY }
    });
    // Convert AQI index (1-5) to AQI value
    const aqiMap = { 1: 50, 2: 100, 3: 150, 4: 250, 5: 400 };
    return aqiMap[res.data.list[0].main.aqi] || 100;
  } catch {
    return getCityMock(city).aqi;
  }
};

const evaluateTriggers = (weatherData) => {
  const triggers = [];

  if (weatherData.temp >= THRESHOLDS.extreme_heat.temp) {
    triggers.push({ type: 'extreme_heat', severity: weatherData.temp >= 47 ? 'extreme' : weatherData.temp >= 44 ? 'high' : 'moderate' });
  }
  if (weatherData.rainfall >= THRESHOLDS.heavy_rain.rainfall) {
    triggers.push({ type: 'heavy_rain', severity: weatherData.rainfall >= 204 ? 'extreme' : weatherData.rainfall >= 115 ? 'high' : 'moderate' });
  }
  if (weatherData.aqi >= THRESHOLDS.severe_pollution.aqi) {
    triggers.push({ type: 'severe_pollution', severity: weatherData.aqi >= 400 ? 'extreme' : weatherData.aqi >= 350 ? 'high' : 'moderate' });
  }
  if (weatherData.windSpeed >= THRESHOLDS.cyclone.windSpeed) {
    triggers.push({ type: 'cyclone', severity: 'high' });
  }
  if (weatherData.visibility < THRESHOLDS.dense_fog.visibility) {
    triggers.push({ type: 'dense_fog', severity: 'moderate' });
  }
  if (weatherData.temp <= THRESHOLDS.cold_wave.temp) {
    triggers.push({ type: 'cold_wave', severity: 'moderate' });
  }

  return triggers;
};

const getWeatherForCities = async (cities) => {
  const results = [];
  for (const city of cities) {
    const data = await fetchWeatherData(city.name, city.lat, city.lon);
    const aqi = await fetchAQIData(city.name, city.lat, city.lon);
    data.aqi = aqi;
    const triggers = evaluateTriggers(data);

    // Save to DB
    for (const trigger of triggers) {
      const existingEvent = await WeatherEvent.findOne({
        city: city.name,
        eventType: trigger.type,
        isActive: true,
        startTime: { $gte: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      });

      if (!existingEvent) {
        await WeatherEvent.create({
          city: city.name,
          eventType: trigger.type,
          severity: trigger.severity,
          data: { temperature: data.temp, rainfall: data.rainfall, windSpeed: data.windSpeed, visibility: data.visibility, aqiIndex: aqi, description: data.description },
          startTime: new Date(),
          isActive: true,
          isTriggerMet: true,
          source: data.source
        });
        logger.info(`New weather event: ${trigger.type} in ${city.name}`);
      }
    }

    results.push({ city: city.name, weather: data, triggers });
  }
  return results;
};

module.exports = { fetchWeatherData, fetchAQIData, evaluateTriggers, getWeatherForCities, THRESHOLDS };
