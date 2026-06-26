import { create } from 'zustand';
import api from '../services/api';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProjectId: null,
  fetchProjects: async () => {
    const res = await api.get('/projects');
    set({ projects: res.data });
  },
  createProject: async (name) => {
    const res = await api.post('/projects', { name });
    set((state) => ({ projects: [...state.projects, res.data] }));
    return res.data;
  },
  setCurrentProject: (id) => set({ currentProjectId: id }),
  renameProject: async (id, name) => {
    const res = await api.put(`/projects/${id}`, { name });
    set((state) => ({
      projects: state.projects.map(p => p.id === id ? res.data : p)
    }));
    return res.data;
  },
  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id),
      currentProjectId: state.currentProjectId === id ? null : state.currentProjectId
    }));
  },
}));