import { create } from 'zustand';
import api from '../services/api';

const TEMP_PREFIX = '__tmp_';
const isTemp = (id) => String(id).startsWith(TEMP_PREFIX);
const tempId = () => `${TEMP_PREFIX}${crypto.randomUUID()}`;

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProjectId: null,

  fetchProjects: async () => {
    const res = await api.get('/projects');
    set({ projects: res.data });
  },

  createProject: async (name) => {
    const optimistic = { id: tempId(), name };
    set((state) => ({ projects: [...state.projects, optimistic] }));

    try {
      const res = await api.post('/projects', { name });
      set((state) => ({
        projects: state.projects.map(p => (p.id === optimistic.id ? res.data : p)),
        currentProjectId: state.currentProjectId === optimistic.id ? res.data.id : state.currentProjectId,
      }));
      return res.data;
    } catch (err) {
      set((state) => ({
        projects: state.projects.filter(p => p.id !== optimistic.id),
        currentProjectId: state.currentProjectId === optimistic.id ? null : state.currentProjectId,
      }));
      throw err;
    }
  },

  setCurrentProject: (id) => set({ currentProjectId: id }),

  renameProject: async (id, name) => {
    const previous = get().projects.find(p => String(p.id) === String(id));
    if (!previous) return;

    set((state) => ({
      projects: state.projects.map(p => (String(p.id) === String(id) ? { ...p, name } : p)),
    }));

    if (isTemp(id)) return;

    try {
      const res = await api.put(`/projects/${id}`, { name });
      set((state) => ({
        projects: state.projects.map(p => (String(p.id) === String(id) ? res.data : p)),
      }));
      return res.data;
    } catch (err) {
      set((state) => ({
        projects: state.projects.map(p => (String(p.id) === String(id) ? previous : p)),
      }));
      throw err;
    }
  },

  deleteProject: async (id) => {
    const previous = get().projects;
    if (!previous.some(p => String(p.id) === String(id))) return;

    set((state) => ({
      projects: state.projects.filter(p => String(p.id) !== String(id)),
      currentProjectId: String(state.currentProjectId) === String(id) ? null : state.currentProjectId,
    }));

    if (isTemp(id)) return;

    try {
      await api.delete(`/projects/${id}`);
    } catch (err) {
      set({ projects: previous });
      throw err;
    }
  },
}));
