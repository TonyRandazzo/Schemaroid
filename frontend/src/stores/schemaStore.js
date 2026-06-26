import { create } from 'zustand';
import api from '../services/api';

export const useSchemaStore = create((set, get) => ({
  schemas: [],
  currentSchemaId: null,
  fetchSchemas: async (projectId) => {
    const res = await api.get(`/schemas/project/${projectId}`);
    set({ schemas: res.data });
    if (res.data.length && !get().currentSchemaId) {
      set({ currentSchemaId: res.data[0].id });
    }
  },
  createSchema: async (projectId, name) => {
    const res = await api.post('/schemas', { projectId, name });
    set((state) => ({ schemas: [...state.schemas, res.data] }));
    return res.data;
  },
  updateSchema: async (id, data) => {
    const res = await api.put(`/schemas/${id}`, data);
    set((state) => ({
      schemas: state.schemas.map(s => s.id === id ? res.data : s)
    }));
    return res.data;
  },
  deleteSchema: async (id) => {
    await api.delete(`/schemas/${id}`);
    set((state) => ({
      schemas: state.schemas.filter(s => s.id !== id),
      currentSchemaId: state.currentSchemaId === id ? (state.schemas.find(s => s.id !== id)?.id || null) : state.currentSchemaId
    }));
  },
  setCurrentSchema: (id) => set({ currentSchemaId: id }),
}));