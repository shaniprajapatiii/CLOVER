import { create } from 'zustand';

const useActivityStore = create((set, get) => ({
  // State
  activities: [],
  isTracking: false,
  lastLocationLog: null,

  // Actions - Start Activity Tracking
  startTracking: (workerId, deliveryPartnerId) => {
    set({ isTracking: true });
    
    // Log online status
    get().logActivity({
      workerId,
      deliveryPartnerId,
      activityType: 'online',
      location: { latitude: 0, longitude: 0 }
    });
  },

  // Actions - Stop Activity Tracking
  stopTracking: (workerId, deliveryPartnerId) => {
    set({ isTracking: false });
    
    // Log offline status
    get().logActivity({
      workerId,
      deliveryPartnerId,
      activityType: 'offline',
      location: { latitude: 0, longitude: 0 }
    });
  },

  // Actions - Log Activity
  logActivity: async (activity) => {
    try {
      const response = await fetch('/api/delivery/activities/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(activity)
      });

      if (!response.ok) throw new Error('Failed to log activity');

      const data = await response.json();
      if (data.success) {
        set((state) => ({
          activities: [data.data, ...state.activities].slice(0, 100), // Keep last 100 activities
          lastLocationLog: new Date()
        }));
      }
    } catch (error) {
      console.error('Activity logging error:', error);
      // Don't throw - let the app continue even if logging fails
    }
  },

  // Actions - Log Real-time Location (Optimized for frequent updates)
  logRealtimeLocation: async (workerId, location, deviceInfo, networkInfo, orderId = null) => {
    // Debounce location logging - don't log too frequently
    const now = new Date();
    const lastLog = get().lastLocationLog;
    if (lastLog && (now - lastLog) < 5000) {
      // Less than 5 seconds since last log, skip
      return;
    }

    try {
      const response = await fetch('/api/delivery/activities/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          workerId,
          activityType: 'location_update',
          location,
          deviceInfo,
          networkInfo,
          orderId
        })
      });

      if (response.ok) {
        set({ lastLocationLog: now });
      }
    } catch (error) {
      console.error('Location logging error:', error);
    }
  },

  // Actions - Log Order Event
  logOrderEvent: async (workerId, orderId, eventType) => {
    const activityTypes = {
      'accepted': 'order_accepted',
      'picked_up': 'order_picked',
      'delivered': 'order_delivered',
      'cancelled': 'order_cancelled'
    };

    await get().logActivity({
      workerId,
      orderId,
      activityType: activityTypes[eventType] || eventType,
      location: { latitude: 0, longitude: 0 }
    });
  },

  // Actions - Get Activity Timeline
  fetchActivityTimeline: async (workerId, limit = 50) => {
    try {
      const response = await fetch(
        `/api/delivery/workers/${workerId}/activities?limit=${limit}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (!response.ok) throw new Error('Failed to fetch activity timeline');

      const data = await response.json();
      if (data.success) {
        set({ activities: data.data });
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching activity timeline:', error);
      throw error;
    }
  },

  // Actions - Sync Activities to CLOVER
  syncToCLOVER: async () => {
    try {
      const response = await fetch('/api/delivery/activities/sync-to-clover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to sync to CLOVER');

      const data = await response.json();
      console.log(`Synced ${data.data.length} activities to CLOVER`);
      return data;
    } catch (error) {
      console.error('Error syncing to CLOVER:', error);
      // Don't throw - background sync shouldn't break the app
    }
  },

  // Actions - Get Worker Stats for Claims
  getWorkerStats: async (workerId, startDate, endDate) => {
    try {
      let url = `/api/delivery/workers/${workerId}/activity-stats`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching worker stats:', error);
      throw error;
    }
  },

  // Actions - Detect Anomalies
  detectAnomalies: async (workerId) => {
    try {
      const response = await fetch(`/api/delivery/activities/anomalies/${workerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to detect anomalies');

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  },

  // Actions - Clear Activities
  clearActivities: () => set({ activities: [] })
}));

export default useActivityStore;
