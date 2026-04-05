import { create } from 'zustand';

const rand = (min, max) => Math.random() * (max - min) + min;

export const useOrderStore = create((set) => ({
  status: 'IDLE', // 'IDLE' | 'RINGING' | 'NAV_PICKUP' | 'AT_PICKUP' | 'NAV_DROP' | 'AT_DROP' | 'PAYMENT'
  earnings: 0,
  ordersCount: 0,
  activeOrder: null,
  availableOrders: [], // Array of incoming orders for the gig worker to choose from

  setStatus: (newStatus) => set({ status: newStatus }),
  
  dispatchMockOrder: () => {
    // Generate between 2 to 4 random orders
    const numOrders = Math.floor(Math.random() * 3) + 2; 
    const fakeRestaurants = ['Biryani Blues', 'Burger King', 'Dominos', 'KFC', 'Subway'];
    
    const orders = Array.from({ length: numOrders }).map((_, i) => ({
      id: `#SWG-${Math.floor(Math.random() * 10000)}`,
      distance: `${rand(1, 8).toFixed(1)}km`,
      earning: Math.floor(rand(30, 150)),
      restaurant: fakeRestaurants[Math.floor(Math.random() * fakeRestaurants.length)],
      customer: ['Rahul', 'Priya', 'Amit', 'Neha', 'Vikas'][Math.floor(Math.random() * 5)],
      items: `${Math.floor(rand(1, 4))}x Items`,
      // Smaller offset bounds so they stay reasonably in viewport
      pickupCoords: { latOffset: rand(-0.02, 0.02), lngOffset: rand(-0.02, 0.02) },
      dropCoords: { latOffset: rand(-0.03, 0.03), lngOffset: rand(-0.03, 0.03) },
    }));

    set({
      status: 'RINGING',
      availableOrders: orders
    });
  },

  acceptOrder: (orderId) => set((state) => {
    // Fallback if ID not found, just grab first
    const selected = state.availableOrders.find(o => o.id === orderId) || state.availableOrders[0];
    return { 
      status: 'NAV_PICKUP', 
      activeOrder: selected,
      availableOrders: [] // clear others
    };
  }),
  
  rejectOrder: () => set({ status: 'IDLE', activeOrder: null, availableOrders: [] }),

  completeOrder: () => set((state) => ({
    status: 'IDLE',
    earnings: state.earnings + (state.activeOrder?.earning || 0),
    ordersCount: state.ordersCount + 1,
    activeOrder: null,
    availableOrders: []
  })),
}));
