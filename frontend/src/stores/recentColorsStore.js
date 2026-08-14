import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MAX_RECENT = 8;

const EMPTY = { fill: [], text: [] };

const normalize = (c) => (typeof c === 'string' ? c.toUpperCase() : null);

export const useRecentColorsStore = create(
  persist(
    (set, get) => ({
      recent: EMPTY,

      addRecent: (kind, color) => {
        const value = normalize(color);
        if (!value || !/^#[0-9A-F]{6}$/.test(value)) return;

        const current = get().recent[kind] ?? [];
        const next = [value, ...current.filter(c => c !== value)].slice(0, MAX_RECENT);
        set((state) => ({ recent: { ...state.recent, [kind]: next } }));
      },
    }),
    {
      name: 'recent-colors',
      merge: (persisted, currentState) => ({
        ...currentState,
        ...persisted,
        recent: { ...EMPTY, ...(persisted?.recent ?? {}) },
      }),
    }
  )
);
