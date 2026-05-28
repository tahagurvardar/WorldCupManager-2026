import { create } from 'zustand';
import { api } from '../services/api.js';

const tokenKey = 'wcm2026.token';

export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem(tokenKey),
  user: null,
  isAuthenticated: Boolean(localStorage.getItem(tokenKey)),
  isBootstrapping: false,
  bootstrap: async () => {
    if (!get().token || get().user || get().isBootstrapping) return;
    set({ isBootstrapping: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, isBootstrapping: false });
    } catch {
      localStorage.removeItem(tokenKey);
      set({ token: null, user: null, isAuthenticated: false, isBootstrapping: false });
    }
  },
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(tokenKey, data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
    return data.user;
  },
  register: async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    localStorage.setItem(tokenKey, data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
    return data.user;
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem(tokenKey);
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
