import React, { useEffect, useMemo, useState } from 'react';
import { weatherAPI } from '../services/api';
import { useAuthStore } from '../store';
import {
  FiActivity,
  FiAlertTriangle,
  FiChevronRight,
  FiCloudRain,
  FiCompass,
  FiDroplet,
  FiMapPin,
  FiSun,
  FiWind,
} from 'react-icons/fi';

const TRIGGER_ICONS = {
  extreme_heat: FiSun,
  heavy_rain: FiCloudRain,
  flood: FiDroplet,
  severe_pollution: FiActivity,
  curfew: FiAlertTriangle,
  strike: FiCompass,
  cyclone: FiWind,
  hailstorm: FiCloudRain,
  dense_fog: FiCloudRain,
  cold_wave: FiWind,
};

const SEVERITY_COLORS = {
  extreme: { bg: 'bg-red-900/30', border: 'border-red-500/50', text: 'text-red-300' },
  high: { bg: 'bg-orange-900/30', border: 'border-orange-500/50', text: 'text-orange-300' },
  moderate: { bg: 'bg-yellow-900/30', border: 'border-yellow-500/50', text: 'text-yellow-300' },
  low: { bg: 'bg-blue-900/30', border: 'border-blue-500/50', text: 'text-blue-300' },
};

function AlertCard({ alert }) {
  const TriggerIcon = TRIGGER_ICONS[alert.eventType] || FiAlertTriangle;
  const severity = alert.severity?.toLowerCase() || 'moderate';
  const colors = SEVERITY_COLORS[severity] || SEVERITY_COLORS.moderate;
  const startTime = new Date(alert.startTime);

  return (
    <div className={`p-4 rounded-xl border ${colors.bg} ${colors.border} transition-all hover:shadow-lg`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colors.bg} border ${colors.border}`}>
          <TriggerIcon className={`text-xl ${colors.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${colors.text} capitalize`}>
              {alert.eventType?.replace(/_/g, ' ')}
            </h3>
            {alert.isActive && <span className="text-xs px-2 py-0.5 bg-red-500/30 border border-red-500/50 text-red-300 rounded-full animate-pulse">ACTIVE</span>}
            <span className="text-xs px-2 py-0.5 bg-white/10 border border-white/20 text-gray-300 rounded-full capitalize">
              {severity}
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
            <FiMapPin className="text-xs flex-shrink-0" />
            <span className="font-medium text-gray-300">{alert.city}</span>
          </div>

          {alert.data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs">
              {alert.data.temperature !== undefined && (
                <div className="bg-white/5 rounded p-2">
                  <p className="text-gray-500">Temperature</p>
                  <p className="font-bold text-white">{alert.data.temperature}°C</p>
                </div>
              )}
              {alert.data.rainfall !== undefined && (
                <div className="bg-white/5 rounded p-2">
                  <p className="text-gray-500">Rainfall</p>
                  <p className="font-bold text-white">{alert.data.rainfall}mm</p>
                </div>
              )}
              {alert.data.windSpeed !== undefined && (
                <div className="bg-white/5 rounded p-2">
                  <p className="text-gray-500">Wind Speed</p>
                  <p className="font-bold text-white">{alert.data.windSpeed}km/h</p>
                </div>
              )}
              {alert.data.aqiIndex !== undefined && (
                <div className="bg-white/5 rounded p-2">
                  <p className="text-gray-500">AQI</p>
                  <p className="font-bold text-white">{alert.data.aqiIndex}</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">Started {startTime.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
}

export default function WeatherAlertsPage() {
  const { worker } = useAuthStore();
  const [alerts, setAlerts] = useState([]);
  const [cities, setCities] = useState([]);
  const [currentForecast, setCurrentForecast] = useState([]);
  const [allCityForecasts, setAllCityForecasts] = useState([]);
  const [geoLocation, setGeoLocation] = useState(null);
  const [geoCityName, setGeoCityName] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState(true);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setGeoLocation({ lat: latitude, lon: longitude });
          weatherAPI.reverseGeocode(latitude, longitude)
            .then((res) => setGeoCityName(res.data?.city))
            .catch(() => setGeoCityName(null));
        },
        (error) => console.log('Geolocation denied:', error.message)
      );
    }
  }, []);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await weatherAPI.getCities();
        setCities(res.data?.cities || []);
      } catch (error) {
        console.log('Error loading cities:', error);
      }
    };
    loadCities();
  }, []);

  const effectiveCity = useMemo(() => {
    if (selectedCity?.name) return selectedCity.name;
    if (geoCityName) return geoCityName;
    return worker?.city || 'Mumbai';
  }, [selectedCity, geoCityName, worker]);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const [eventsRes] = await Promise.all([
          weatherAPI.getEvents({
            city: effectiveCity,
            active: filterActive ? 'true' : '',
            limit: 100
          })
        ]);
        setAlerts(eventsRes.data?.events || []);
      } catch (error) {
        console.log('Error loading alerts:', error);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [effectiveCity, filterActive]);

  useEffect(() => {
    const loadCurrentForecast = async () => {
      try {
        const res = await weatherAPI.getForecast({ city: effectiveCity, days: 5 });
        setCurrentForecast(res.data?.forecast || []);
      } catch (error) {
        console.log('Error loading current forecast:', error);
        setCurrentForecast([]);
      }
    };

    if (effectiveCity) {
      loadCurrentForecast();
    }
  }, [effectiveCity]);

  useEffect(() => {
    const loadAllCityForecast = async () => {
      try {
        const res = await weatherAPI.getForecastAllCities(3);
        setAllCityForecasts(res.data?.cities || []);
      } catch (error) {
        console.log('Error loading all city forecast:', error);
        setAllCityForecasts([]);
      }
    };

    loadAllCityForecast();
  }, []);

  const activeAlerts = alerts.filter((alert) => alert.isActive);
  const formatDay = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short' });

  return (
    <div className="page-container animate-slide-in">
      <div className="section-head">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="section-chip mb-3">Real-Time Monitoring</span>
            <h1 className="font-display text-3xl font-bold text-white">Weather Alerts</h1>
            <p className="text-gray-400 mt-2">Default alerts are based on your current location. Pick any city to change the view.</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm text-blue-200">
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
              Current location
            </div>
            <p className="mt-1 text-blue-300">📍 {geoCityName || worker?.city || 'Detecting...'}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCity(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !selectedCity
              ? 'bg-brand-500 text-white'
              : 'bg-white/10 text-gray-400 hover:bg-white/15'
          }`}
        >
          📍 Use Current Location
        </button>
        <button
          onClick={() => setFilterActive(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterActive
              ? 'bg-brand-500 text-white'
              : 'bg-white/10 text-gray-400 hover:bg-white/15'
          }`}
        >
          🔴 Active Only ({activeAlerts.length})
        </button>
        <button
          onClick={() => setFilterActive(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !filterActive
              ? 'bg-brand-500 text-white'
              : 'bg-white/10 text-gray-400 hover:bg-white/15'
          }`}
        >
          📊 All Alerts ({alerts.length})
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-brand-400 rounded-full"></span>
          Show any city
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {cities.map((city) => {
            const isSelected = selectedCity?.name === city.name;
            return (
              <button
                key={city.name}
                onClick={() => setSelectedCity(city)}
                className={`p-3 rounded-lg text-sm font-medium transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-brand-500 text-white border border-brand-400'
                    : 'bg-white/10 text-gray-400 border border-white/20 hover:bg-white/15'
                }`}
              >
                <span className="truncate">{city.name}</span>
                {isSelected && <FiChevronRight className="text-lg flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-300">
        Showing weather alerts for <span className="text-white font-semibold">{effectiveCity}</span>
        {selectedCity?.name ? ' (city override)' : ' (current location default)'}
      </div>

      {/* Forecast Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="xl:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Forecast for {effectiveCity}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Next 5 days</p>
            </div>
          </div>
          {currentForecast.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {currentForecast.map((day) => (
                <div key={day.date} className="bg-white/[0.04] border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-gray-400">{formatDay(day.date)}</p>
                  <p className="text-white font-bold mt-1">{Math.round(day.tempMax)}° / {Math.round(day.tempMin)}°</p>
                  <p className="text-[11px] text-gray-500 mt-1">Rain: {Math.round(day.rainChance)}%</p>
                  <p className="text-[11px] text-gray-500">Wind: {Math.round(day.windMax)} km/h</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Forecast unavailable for {effectiveCity}.</p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-white">All City Forecast</h2>
            <span className="text-xs text-gray-500">Top cities</span>
          </div>
          {allCityForecasts.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-auto pr-1">
              {allCityForecasts.map((item) => {
                const today = item.forecast?.[0];
                return (
                  <div key={item.city} className="p-3 bg-white/[0.04] border border-white/10 rounded-xl">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-semibold">{item.city}</p>
                      <p className="text-xs text-gray-500">{item.state}</p>
                    </div>
                    {today ? (
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.round(today.tempMax)}° / {Math.round(today.tempMin)}° · Rain {Math.round(today.rainChance)}%
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">No forecast data</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">City forecast unavailable.</p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-xl skeleton" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {(filterActive ? alerts : alerts).length === 0 ? (
            <div className="text-center py-12">
              <FiSun className="text-4xl text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">
                No {filterActive ? 'active' : ''} alerts detected for {effectiveCity}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {(filterActive ? activeAlerts : alerts).map((alert) => (
                <AlertCard key={alert._id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
