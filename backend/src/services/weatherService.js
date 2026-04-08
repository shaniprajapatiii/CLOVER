const axios = require('axios');
const WeatherEvent = require('../models/WeatherEvent');
const logger = require('../utils/logger');

const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_REVERSE_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/reverse';
const NOMINATIM_REVERSE_GEOCODING_URL = 'https://nominatim.openstreetmap.org/reverse';
const OPEN_METEO_WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

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

// Reverse geocoding: Convert lat/lon to city name
const reverseGeocode = async (lat, lon) => {
  const buildName = (payload) => {
    const results = payload?.results || payload?.data?.results || [];
    const first = results[0] || {};
    const name = first.name || first.city || first.town || first.village || first.admin1 || first.admin2;
    return name || null;
  };

  try {
    const res = await axios.get(OPEN_METEO_REVERSE_GEOCODING_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        count: 1,
        language: 'en',
        format: 'json'
      },
      timeout: 6000
    });
    const cityName = buildName(res.data);
    if (cityName) return cityName;
  } catch (err) {
    logger.warn(`Open-Meteo reverse geocoding failed: ${err.message}`);
  }

  try {
    const res = await axios.get(NOMINATIM_REVERSE_GEOCODING_URL, {
      params: {
        lat,
        lon,
        format: 'jsonv2',
        addressdetails: 1,
        zoom: 10
      },
      headers: {
        'User-Agent': 'CloverWeather/1.0 (location lookup)'
      },
      timeout: 6000
    });

    const address = res.data?.address || {};
    const cityName = address.city || address.town || address.village || address.county || address.state;
    if (cityName) return cityName;
  } catch (err) {
    logger.warn(`Nominatim reverse geocoding failed: ${err.message}`);
  }

  return null;
};

// List of major Indian cities for city selector
const MAJOR_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  { name: 'Bangalore', state: 'Karnataka' },
  { name: 'Hyderabad', state: 'Telangana' },
  { name: 'Chennai', state: 'Tamil Nadu' },
  { name: 'Kolkata', state: 'West Bengal' },
  { name: 'Pune', state: 'Maharashtra' },
  { name: 'Ahmedabad', state: 'Gujarat' },
  { name: 'Jaipur', state: 'Rajasthan' },
  { name: 'Lucknow', state: 'Uttar Pradesh' },
  { name: 'Indore', state: 'Madhya Pradesh' },
  { name: 'Chandigarh', state: 'Chandigarh' },
  { name: 'Surat', state: 'Gujarat' },
  { name: 'Vadodara', state: 'Gujarat' },
  { name: 'Nagpur', state: 'Maharashtra' }
];

const safeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const deriveAqiFromPm25 = (pm25) => {
  // Approximate US AQI conversion for PM2.5 as a fallback when AQI is unavailable.
  const p = safeNumber(pm25, 0);
  if (p <= 12) return Math.round((50 / 12) * p);
  if (p <= 35.4) return Math.round(((100 - 51) / (35.4 - 12.1)) * (p - 12.1) + 51);
  if (p <= 55.4) return Math.round(((150 - 101) / (55.4 - 35.5)) * (p - 35.5) + 101);
  if (p <= 150.4) return Math.round(((200 - 151) / (150.4 - 55.5)) * (p - 55.5) + 151);
  if (p <= 250.4) return Math.round(((300 - 201) / (250.4 - 150.5)) * (p - 150.5) + 201);
  if (p <= 350.4) return Math.round(((400 - 301) / (350.4 - 250.5)) * (p - 250.5) + 301);
  return Math.round(((500 - 401) / (500.4 - 350.5)) * (Math.min(p, 500.4) - 350.5) + 401);
};

const geocodeCity = async (city) => {
  try {
    const res = await axios.get(OPEN_METEO_GEOCODING_URL, {
      params: {
        name: city,
        country: 'IN',
        count: 1,
        language: 'en',
        format: 'json'
      },
      timeout: 6000
    });

    const first = res.data?.results?.[0];
    if (!first) return null;

    return {
      lat: first.latitude,
      lon: first.longitude,
      resolvedCity: first.name
    };
  } catch (err) {
    logger.warn(`Geocoding failed for ${city}: ${err.message}`);
    return null;
  }
};

const fetchWeatherData = async (city, lat, lon) => {
  try {
    let resolvedLat = lat;
    let resolvedLon = lon;
    let resolvedCity = city;

    if (!resolvedLat || !resolvedLon) {
      const geo = await geocodeCity(city);
      if (geo) {
        resolvedLat = geo.lat;
        resolvedLon = geo.lon;
        resolvedCity = geo.resolvedCity || city;
      }
    }

    if (!resolvedLat || !resolvedLon) {
      throw new Error('Unable to resolve city coordinates');
    }

    if (!resolvedCity && resolvedLat && resolvedLon) {
      resolvedCity = await reverseGeocode(resolvedLat, resolvedLon) || 'Current location';
    }

    const res = await axios.get(OPEN_METEO_WEATHER_URL, {
      params: {
        latitude: resolvedLat,
        longitude: resolvedLon,
        current: [
          'temperature_2m',
          'apparent_temperature',
          'relative_humidity_2m',
          'precipitation',
          'wind_speed_10m',
          'visibility',
          'weather_code'
        ].join(','),
        timezone: 'auto'
      },
      timeout: 7000
    });

    const c = res.data?.current || {};

    return {
      temp: safeNumber(c.temperature_2m),
      feelsLike: safeNumber(c.apparent_temperature),
      humidity: safeNumber(c.relative_humidity_2m),
      rainfall: safeNumber(c.precipitation),
      windSpeed: safeNumber(c.wind_speed_10m),
      visibility: safeNumber(c.visibility, 5000),
      description: `code_${safeNumber(c.weather_code)}`,
      weatherCode: safeNumber(c.weather_code),
      lat: resolvedLat,
      lon: resolvedLon,
      city: resolvedCity,
      source: 'open-meteo'
    };
  } catch (err) {
    logger.error(`Weather API failed for ${city}: ${err.message}`);
    throw new Error(`Unable to fetch live weather for ${city}. Please ensure coordinates are valid or try a different location.`);
  }
};

const fetchAQIData = async (city, lat, lon) => {
  try {
    let resolvedLat = lat;
    let resolvedLon = lon;

    if (!resolvedLat || !resolvedLon) {
      const geo = await geocodeCity(city);
      resolvedLat = geo?.lat;
      resolvedLon = geo?.lon;
    }

    if (!resolvedLat || !resolvedLon) {
      throw new Error('Unable to resolve city coordinates for AQI');
    }

    const res = await axios.get(OPEN_METEO_AIR_QUALITY_URL, {
      params: {
        latitude: resolvedLat,
        longitude: resolvedLon,
        current: 'us_aqi,pm2_5',
        timezone: 'auto'
      },
      timeout: 7000
    });

    const current = res.data?.current || {};
    const aqi = safeNumber(current.us_aqi, 0);
    if (aqi > 0) return aqi;

    return deriveAqiFromPm25(current.pm2_5);
  } catch (err) {
    logger.error(`AQI API failed for ${city}: ${err.message}`);
    throw new Error(`Unable to fetch live AQI data. ${err.message}`);
  }
};

const fetchForecastData = async (city, lat, lon, days = 5) => {
  try {
    let resolvedLat = lat;
    let resolvedLon = lon;
    let resolvedCity = city;

    if (!resolvedLat || !resolvedLon) {
      const geo = await geocodeCity(city);
      if (geo) {
        resolvedLat = geo.lat;
        resolvedLon = geo.lon;
        resolvedCity = geo.resolvedCity || city;
      }
    }

    if (!resolvedLat || !resolvedLon) {
      throw new Error('Unable to resolve city coordinates for forecast');
    }

    if (!resolvedCity) {
      resolvedCity = await reverseGeocode(resolvedLat, resolvedLon) || 'Current location';
    }

    const res = await axios.get(OPEN_METEO_WEATHER_URL, {
      params: {
        latitude: resolvedLat,
        longitude: resolvedLon,
        daily: [
          'weather_code',
          'temperature_2m_max',
          'temperature_2m_min',
          'precipitation_probability_max',
          'wind_speed_10m_max'
        ].join(','),
        forecast_days: Math.min(Math.max(Number(days) || 5, 1), 7),
        timezone: 'auto'
      },
      timeout: 7000
    });

    const daily = res.data?.daily || {};
    const dates = daily.time || [];
    const forecast = dates.map((date, index) => ({
      date,
      weatherCode: safeNumber(daily.weather_code?.[index]),
      tempMax: safeNumber(daily.temperature_2m_max?.[index]),
      tempMin: safeNumber(daily.temperature_2m_min?.[index]),
      rainChance: safeNumber(daily.precipitation_probability_max?.[index]),
      windMax: safeNumber(daily.wind_speed_10m_max?.[index])
    }));

    return {
      city: resolvedCity,
      lat: resolvedLat,
      lon: resolvedLon,
      source: 'open-meteo',
      forecast
    };
  } catch (err) {
    logger.error(`Forecast API failed for ${city || `${lat},${lon}`}: ${err.message}`);
    throw new Error(`Unable to fetch live forecast for ${city || 'current location'}.`);
  }
};

const fetchForecastForMajorCities = async (days = 3) => {
  const selectedCities = MAJOR_CITIES.slice(0, 8);
  const results = await Promise.all(
    selectedCities.map(async (city) => {
      const data = await fetchForecastData(city.name, null, null, days);
      return {
        city: city.name,
        state: city.state,
        forecast: data.forecast
      };
    })
  );
  return results;
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

module.exports = {
  fetchWeatherData,
  fetchAQIData,
  fetchForecastData,
  fetchForecastForMajorCities,
  evaluateTriggers,
  getWeatherForCities,
  THRESHOLDS,
  reverseGeocode,
  MAJOR_CITIES
};
