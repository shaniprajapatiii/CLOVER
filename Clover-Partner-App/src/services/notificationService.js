// Notification Service - Real-time order notifications
import { useOrderStore } from '../store/useOrderStore';
import { apiFetch } from './httpClient';
import { API_BASE } from './apiBase';

export const notificationService = {
  // Polling service to check for new orders every 10 seconds
  startOrderPolling(workerId, latitude, longitude, onNewOrder) {
    let pollingInterval;

    const poll = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const data = await apiFetch(
          `${API_BASE}/delivery/orders/available?latitude=${latitude}&longitude=${longitude}&maxDistance=5`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          },
          'Failed to fetch available orders'
        );

        if (data.data && data.data.length > 0) {
          const orders = data.data;
          
          // Check for new orders not yet shown
          const storedOrders = localStorage.getItem('shownOrders');
          const shownIds = storedOrders ? JSON.parse(storedOrders) : [];
          
          orders.forEach(order => {
            if (!shownIds.includes(order._id)) {
              // New order! Notify user
              onNewOrder(order);
              
              // Play notification sound
              notificationService.playSound();
              
              // Show notification
              notificationService.showNotification(order);
              
              // Mark as shown
              shownIds.push(order._id);
              localStorage.setItem('shownOrders', JSON.stringify(shownIds));
            }
          });
        }
      } catch (error) {
        console.warn('Polling error:', error.message);
      }
    };

    // Start polling immediately and then every 10 seconds
    poll();
    pollingInterval = setInterval(poll, 10000);

    // Return function to stop polling
    return () => clearInterval(pollingInterval);
  },

  // Show browser notification
  showNotification(order) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const amount = order.totalAmount || 0;
      const distance = order.estimatedDistance || 'N/A';
      
      new Notification('New Order Received! 🎉', {
        body: `Pickup: ${order.pickupLocation?.address || 'Location'}\nAmount: ₹${amount}\nDistance: ${distance}km`,
        icon: '/notification-icon.png',
        tag: order._id,
        badge: '/badge.png'
      });
    }
  },

  // Request notification permission
  async requestNotificationPermission() {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return Notification.permission === 'granted';
    }
    return false;
  },

  // Play notification sound
  playSound() {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
      audio.play().catch(() => {
        // Fallback: Use Web Audio API if audio file fails
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      });
    } catch (error) {
      console.warn('Could not play sound:', error.message);
    }
  }
};
