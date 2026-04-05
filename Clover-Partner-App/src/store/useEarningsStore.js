import { create } from 'zustand';

export const useEarningsStore = create((set) => ({
  todayEarnings: {
    total: 845,
    basePay: 450,
    surge: 120,
    incentives: 200,
    tips: 75,
    completedOrders: 14,
  },

  weeklyEarnings: {
    total: 4250,
    weekRange: '18 Mar - 24 Mar',
    status: 'Next Payout on Wed',
  },

  incentiveTarget: {
    currentOrders: 14,
    targetOrders: 15,
    bonusAmount: 250,
    text: 'Complete 1 more order to unlock ₹250 bonus!',
  },

  orderHistory: [
    { id: 'SWG-9901', restaurant: 'Biryani Blues', time: '02:15 PM', distance: '4.2 km', earning: 65, type: 'food' },
    { id: 'SWG-9897', restaurant: 'Dominos', time: '01:30 PM', distance: '3.1 km', earning: 52, type: 'food' },
    { id: 'SWG-9885', restaurant: 'KFC', time: '12:45 PM', distance: '5.8 km', earning: 78, type: 'food' },
    { id: 'SWG-9870', restaurant: 'Subway', time: '11:20 AM', distance: '2.4 km', earning: 42, type: 'food' },
    { id: 'SWG-9862', restaurant: 'Burger King', time: '10:05 AM', distance: '6.1 km', earning: 88, type: 'food' },
  ],

  addCompletedOrder: (orderData) =>
    set((state) => {
      const newOrder = {
        id: orderData.id || `SWG-${Math.floor(Math.random() * 10000)}`,
        restaurant: orderData.restaurant || 'Unknown',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase(),
        distance: orderData.distance || '0 km',
        earning: orderData.earning || 0,
        type: orderData.type || 'food',
      };

      const newCurrentOrders = state.incentiveTarget.currentOrders + 1;
      const remaining = Math.max(state.incentiveTarget.targetOrders - newCurrentOrders, 0);

      return {
        orderHistory: [newOrder, ...state.orderHistory],
        todayEarnings: {
          ...state.todayEarnings,
          total: state.todayEarnings.total + newOrder.earning,
          basePay: state.todayEarnings.basePay + Math.round(newOrder.earning * 0.55),
          surge: state.todayEarnings.surge + Math.round(newOrder.earning * 0.15),
          tips: state.todayEarnings.tips + Math.round(newOrder.earning * 0.1),
          completedOrders: state.todayEarnings.completedOrders + 1,
        },
        incentiveTarget: {
          ...state.incentiveTarget,
          currentOrders: newCurrentOrders,
          text: remaining > 0
            ? `Complete ${remaining} more order${remaining > 1 ? 's' : ''} to unlock ₹${state.incentiveTarget.bonusAmount} bonus!`
            : `🎉 Bonus of ₹${state.incentiveTarget.bonusAmount} unlocked!`,
        },
      };
    }),
}));
