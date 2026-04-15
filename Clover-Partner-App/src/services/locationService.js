// Real-time Location & Activity Service
import { apiFetch } from './httpClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const locationService = {
  // Log activity (online/offline/location update)
  async logActivity(workerId, deliveryPartnerId, activityData) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/activities/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId,
          deliveryPartnerId,
          ...activityData
        })
      }, 'Failed to log activity');
      return data.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  },

  // Log real-time location during delivery
  async logDeliveryLocation(orderId, workerId, location, deviceInfo, networkInfo) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/orders/${orderId}/location`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId,
          location,
          deviceInfo,
          networkInfo,
          timestamp: new Date().toISOString()
        })
      }, 'Failed to log location');
      return data.data;
    } catch (error) {
      console.warn('Warning: Could not log location:', error.message);
    }
  },

  // Get worker activity timeline
  async getActivityTimeline(workerId, limit = 50) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(
        `${API_BASE}/delivery/workers/${workerId}/activities?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        },
        'Failed to fetch timeline'
      );
      return data.data || [];
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
      throw error;
    }
  },

  // Get worker activity stats
  async getActivityStats(workerId) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/workers/${workerId}/activity-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, 'Failed to fetch stats');
      return data.data;
    } catch (error) {
      console.error('Error fetching activity stats:', error);
      throw error;
    }
  },

  // Sync activities to CLOVER
  async syncToCLOVER(workerId) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/activities/sync-to-clover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workerId })
      }, 'Failed to sync to CLOVER');
      return data.data;
    } catch (error) {
      console.error('Error syncing to CLOVER:', error);
      throw error;
    }
  },

  // Detect anomalies (fraud detection)
  async detectAnomalies(workerId) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/activities/anomalies/${workerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, 'Failed to detect anomalies');
      return data.data;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }
};
