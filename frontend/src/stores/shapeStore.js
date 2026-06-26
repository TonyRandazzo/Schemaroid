import { create } from 'zustand';
import api from '../services/api';

export const useShapeStore = create((set, get) => ({
  shapes: [],
  connections: [],
  fetchShapes: async (schemaId) => {
    const [shapesRes, connRes] = await Promise.all([
      api.get(`/shapes/schema/${schemaId}`),
      api.get(`/connections/schema/${schemaId}`)
    ]);
    set({ shapes: shapesRes.data, connections: connRes.data });
  },
  addShape: async (shapeData) => {
    const res = await api.post('/shapes', shapeData);
    set((state) => ({ shapes: [...state.shapes, res.data] }));
    return res.data;
  },
  updateShape: async (id, data) => {
    const res = await api.put(`/shapes/${id}`, data);
    set((state) => ({
      shapes: state.shapes.map(s => s.id === id ? res.data : s)
    }));
    return res.data;
  },
  deleteShape: async (id) => {
    await api.delete(`/shapes/${id}`);
    set((state) => ({ shapes: state.shapes.filter(s => s.id !== id) }));
  },
  addConnection: async (source, target, schemaId, label) => {
    const res = await api.post('/connections', { source_shape_id: source, target_shape_id: target, schemaId, label });
    set((state) => ({ connections: [...state.connections, res.data] }));
    return res.data;
  },
  deleteConnection: async (id) => {
    await api.delete(`/connections/${id}`);
    set((state) => ({ connections: state.connections.filter(c => c.id !== id) }));
  },
}));