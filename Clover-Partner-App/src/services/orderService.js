// Real-time Order & Delivery Service
import { apiFetch } from './httpClient';
import { API_BASE } from './apiBase';

export const orderService = {
  // Get nearby available orders
  async getNearbyOrders(latitude, longitude, maxDistance = 5) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(
        `${API_BASE}/delivery/orders/available?latitude=${latitude}&longitude=${longitude}&maxDistance=${maxDistance}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        },
        'Failed to fetch orders'
      );
      return data.data || [];
    } catch (error) {
      console.error('Error fetching nearby orders:', error);
      throw error;
    }
  },

  // Accept an order
  async acceptOrder(orderId, workerId) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/orders/${orderId}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ workerId })
      }, 'Failed to accept order');
      return data.data;
    } catch (error) {
      console.error('Error accepting order:', error);
      throw error;
    }
  },

  // Get active delivery details
  async getActiveDelivery(deliveryId) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/deliveries/${deliveryId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, 'Failed to fetch delivery');
      return data.data;
    } catch (error) {
      console.error('Error fetching delivery:', error);
      throw error;
    }
  },

  // Get worker's active deliveries
  async getActiveDeliveries(workerId) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/workers/${workerId}/deliveries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, 'Failed to fetch deliveries');
      return data.data || [];
    } catch (error) {
      console.error('Error fetching active deliveries:', error);
      throw error;
    }
  },

  // Update delivery status
  async updateDeliveryStatus(deliveryId, status, location) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/deliveries/${deliveryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, location })
      }, 'Failed to update status');
      return data.data;
    } catch (error) {
      console.error('Error updating delivery status:', error);
      throw error;
    }
  },

  // Submit delivery proof (photo, signature, OTP)
  async submitDeliveryProof(deliveryId, proof) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/deliveries/${deliveryId}/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(proof)
      }, 'Failed to submit proof');
      return data.data;
    } catch (error) {
      console.error('Error submitting proof:', error);
      throw error;
    }
  },

  // Get delivery tracking path (all locations with timestamps)
  async getDeliveryTracking(orderId) {
    try {
      const token = localStorage.getItem('authToken');
      const data = await apiFetch(`${API_BASE}/delivery/orders/${orderId}/tracking`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, 'Failed to fetch tracking');
      return data.data || [];
    } catch (error) {
      console.error('Error fetching tracking:', error);
      throw error;
    }
  },

  // Get worker's orders
  async getWorkerOrders(workerId, status) {
    try {
      const token = localStorage.getItem('authToken');
      const query = status ? `?status=${status}` : '';
      const data = await apiFetch(`${API_BASE}/delivery/workers/${workerId}/orders${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }, 'Failed to fetch orders');
      return data.data || [];
    } catch (error) {
      console.error('Error fetching worker orders:', error);
      throw error;
    }
  }
};
