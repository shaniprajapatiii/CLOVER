import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      worker: null,
      token: null,
      isAuthenticated: false,

      login: (worker, token) => set({ worker, token, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('clover-auth');
        set({ worker: null, token: null, isAuthenticated: false });
      },
      updateWorker: (updates) => set(state => ({ worker: { ...state.worker, ...updates } })),
    }),
    { name: 'clover-auth', partialize: (state) => ({ token: state.token, worker: state.worker, isAuthenticated: state.isAuthenticated }) }
  )
);

export const useUIStore = create((set) => ({
  sidebarOpen: true,
  activeSection: 'dashboard',
  notifications: [],
  unreadCount: 0,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveSection: (section) => set({ activeSection: section }),
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
