// Authentication Service - Handle all auth-related API calls
import { useAuthStore } from '../store/useAuthStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const authService = {
  // Send OTP to phone number
  async sendOtp(phone) {
    try {
      const response = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Verify OTP and get token
  async verifyOtp(phone, otp) {
    try {
      const response = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');
      
      // Store token locally
      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }
      if (data.worker) {
        localStorage.setItem('partnerId', data.worker._id || data._id || '');
        useAuthStore.getState().login(data.worker);
      } else if (data._id) {
        localStorage.setItem('partnerId', data._id);
        useAuthStore.getState().login({ _id: data._id, phone });
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Register new partner with full details
  async registerPartner(partnerData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/workers/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(partnerData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      if (data.worker) {
        localStorage.setItem('partnerId', data.worker._id);
        localStorage.setItem('partnerData', JSON.stringify(data.worker));
        useAuthStore.getState().login(data.worker);
      }
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Get partner profile
  async getProfile(workerId) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/workers/${workerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
      return data.worker || data;
    } catch (error) {
      throw error;
    }
  },

  // Update partner profile
  async updateProfile(workerId, profileData) {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE}/workers/${workerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');
      if (data.worker) {
        localStorage.setItem('partnerData', JSON.stringify(data.worker));
        useAuthStore.getState().login(data.worker);
      }
      return data.worker || data;
    } catch (error) {
      throw error;
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('partnerId');
    localStorage.removeItem('partnerData');
  }
};
