import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isGuest: false,
      login: async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        set({ user: res.data.user, token: res.data.token, isGuest: false });
        return res.data;
      },
      register: async (username, password) => {
        const res = await api.post('/auth/register', { username, password });
        set({ user: res.data.user, token: res.data.token, isGuest: false });
        return res.data;
      },
      guestLogin: async (guestId) => {
        const res = await api.post('/auth/guest', { guestId });
        set({ user: res.data.user, token: res.data.token, isGuest: true });
        return res.data;
      },
      logout: () => set({ user: null, token: null, isGuest: false }),
      updateProfile: async (data) => {
        const res = await api.put('/auth/profile', data);
        set({ user: res.data.user, token: res.data.token });
        return res.data;
      },
    }),
    { name: 'auth-storage' }
  )
);