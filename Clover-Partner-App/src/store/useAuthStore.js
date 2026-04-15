import { create } from 'zustand';

const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');
let savedUser = null;
if (typeof window !== 'undefined') {
  try {
    savedUser = JSON.parse(localStorage.getItem('partnerData') || 'null');
  } catch {
    savedUser = null;
  }
}

export const useAuthStore = create((set) => ({
  isAuthenticated: hasToken,
  user: savedUser,
  login: (userData) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('partnerData', JSON.stringify(userData || null));
    }
    set({ isAuthenticated: true, user: userData || null });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('partnerId');
      localStorage.removeItem('partnerData');
    }
    set({ isAuthenticated: false, user: null });
  },
}));
