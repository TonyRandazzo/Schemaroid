import { create } from 'zustand';
import api from '../services/api';
import { settle } from './settleCache';


const TEMP_PREFIX = '__tmp_';
const isTemp = (id) => String(id).startsWith(TEMP_PREFIX);
const tempId = () => `${TEMP_PREFIX}${crypto.randomUUID()}`;
const sameId = (a, b) => String(a) === String(b);

export const useShapeStore = create((set, get) => ({
  shapes: [],
  connections: [],
  activeSchemaId: null,
  loadingSchemaId: null,
  cache: {},

  _requestSeq: 0,

  fetchShapes: async (schemaId) => {
    const seq = get()._requestSeq + 1;
    const cached = get().cache[schemaId];

    set({
      _requestSeq: seq,
      activeSchemaId: schemaId,
      shapes: cached?.shapes ?? [],
      connections: cached?.connections ?? [],
      loadingSchemaId: cached ? null : schemaId,
    });

    try {
      const [shapesRes, connRes] = await Promise.all([
        api.get(`/shapes/schema/${schemaId}`),
        api.get(`/connections/schema/${schemaId}`),
      ]);

      const fresh = { shapes: shapesRes.data, connections: connRes.data };
      set((state) => ({
        cache: { ...state.cache, [schemaId]: fresh },
        ...(state._requestSeq === seq ? { ...fresh, loadingSchemaId: null } : {}),
      }));
    } catch (err) {
      if (get()._requestSeq === seq) set({ loadingSchemaId: null });
      throw err;
    }
  },

  addShape: async (shapeData) => {
    const schemaId = shapeData.schemaId;
    const optimistic = { ...shapeData, id: tempId(), schema_id: schemaId };
    set((state) => ({ shapes: [...state.shapes, optimistic] }));

    try {
      const res = await api.post('/shapes', shapeData);
      set((state) => settle(state, schemaId, {
        shapes: state.shapes.map(s => (s.id === optimistic.id ? res.data : s)),
      }));
      return res.data;
    } catch (err) {
      set((state) => ({ shapes: state.shapes.filter(s => s.id !== optimistic.id) }));
      throw err;
    }
  },

  updateShape: async (id, data) => {
    const previous = get().shapes.find(s => sameId(s.id, id));
    if (!previous) return;
    const schemaId = previous.schema_id;

    set((state) => ({
      shapes: state.shapes.map(s => (sameId(s.id, id) ? { ...s, ...data } : s)),
    }));

    if (isTemp(id)) return;

    try {
      const res = await api.put(`/shapes/${id}`, data);
      set((state) => settle(state, schemaId, {
        shapes: state.shapes.map(s => (sameId(s.id, id) ? res.data : s)),
      }));
      return res.data;
    } catch (err) {
      set((state) => ({
        shapes: state.shapes.map(s => (sameId(s.id, id) ? previous : s)),
      }));
      throw err;
    }
  },

  deleteShape: async (id) => {
    const previous = get().shapes.find(s => sameId(s.id, id));
    if (!previous) return;
    const previousConnections = get().connections;
    const schemaId = previous.schema_id;

    set((state) => ({
      shapes: state.shapes.filter(s => !sameId(s.id, id)),
      connections: state.connections.filter(
        c => !sameId(c.source_shape_id, id) && !sameId(c.target_shape_id, id)
      ),
    }));

    if (isTemp(id)) return;

    try {
      await api.delete(`/shapes/${id}`);
      set((state) => settle(state, schemaId, {}));
    } catch (err) {
      set((state) => ({
        shapes: [...state.shapes, previous],
        connections: previousConnections,
      }));
      throw err;
    }
  },

  addConnection: async (source, target, schemaId, label, handles = {}) => {
    const optimistic = {
      id: tempId(),
      source_shape_id: source,
      target_shape_id: target,
      schema_id: schemaId,
      label,
      source_handle: handles.source_handle ?? null,
      target_handle: handles.target_handle ?? null,
    };
    set((state) => ({ connections: [...state.connections, optimistic] }));

    try {
      const res = await api.post('/connections', {
        source_shape_id: source,
        target_shape_id: target,
        schemaId,
        label,
        source_handle: handles.source_handle ?? undefined,
        target_handle: handles.target_handle ?? undefined,
      });
      set((state) => settle(state, schemaId, {
        connections: state.connections.map(c => (c.id === optimistic.id ? res.data : c)),
      }));
      return res.data;
    } catch (err) {
      set((state) => ({ connections: state.connections.filter(c => c.id !== optimistic.id) }));
      throw err;
    }
  },

  deleteConnection: async (id) => {
    const previous = get().connections.find(c => sameId(c.id, id));
    if (!previous) return;
    const schemaId = previous.schema_id;

    set((state) => ({ connections: state.connections.filter(c => !sameId(c.id, id)) }));

    if (isTemp(id)) return;

    try {
      await api.delete(`/connections/${id}`);
      set((state) => settle(state, schemaId, {}));
    } catch (err) {
      set((state) => ({ connections: [...state.connections, previous] }));
      throw err;
    }
  },
}));
