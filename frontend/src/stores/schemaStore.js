import { create } from 'zustand';
import api from '../services/api';

const TEMP_PREFIX = '__tmp_';
const isTemp = (id) => String(id).startsWith(TEMP_PREFIX);
const tempId = () => `${TEMP_PREFIX}${crypto.randomUUID()}`;

export const useSchemaStore = create((set, get) => ({
  schemas: [],
  currentSchemaId: null,
  cache: {},
  _requestSeq: 0,

  fetchSchemas: async (projectId) => {
    const seq = get()._requestSeq + 1;
    const cached = get().cache[projectId];

    set({ _requestSeq: seq, schemas: cached ?? [] });
    if (cached?.length && !get().currentSchemaId) {
      set({ currentSchemaId: cached[0].id });
    }

    const res = await api.get(`/schemas/project/${projectId}`);
    set((state) => ({
      cache: { ...state.cache, [projectId]: res.data },
      ...(state._requestSeq === seq ? { schemas: res.data } : {}),
    }));

    if (get()._requestSeq === seq && res.data.length && !get().currentSchemaId) {
      set({ currentSchemaId: res.data[0].id });
    }
  },

  createSchema: async (projectId, name) => {
    const optimistic = { id: tempId(), project_id: projectId, name };
    set((state) => ({ schemas: [...state.schemas, optimistic] }));

    try {
      const res = await api.post('/schemas', { projectId, name });
      set((state) => {
        const schemas = state.schemas.map(s => (s.id === optimistic.id ? res.data : s));
        return { schemas, cache: { ...state.cache, [projectId]: schemas } };
      });
      return res.data;
    } catch (err) {
      set((state) => ({ schemas: state.schemas.filter(s => s.id !== optimistic.id) }));
      throw err;
    }
  },

  updateSchema: async (id, data) => {
    const previous = get().schemas.find(s => String(s.id) === String(id));
    if (!previous) return;

    set((state) => ({
      schemas: state.schemas.map(s => (String(s.id) === String(id) ? { ...s, ...data } : s)),
    }));

    if (isTemp(id)) return;

    try {
      const res = await api.put(`/schemas/${id}`, data);
      set((state) => {
        const schemas = state.schemas.map(s => (String(s.id) === String(id) ? res.data : s));
        return { schemas, cache: { ...state.cache, [previous.project_id]: schemas } };
      });
      return res.data;
    } catch (err) {
      set((state) => ({
        schemas: state.schemas.map(s => (String(s.id) === String(id) ? previous : s)),
      }));
      throw err;
    }
  },

  deleteSchema: async (id) => {
    const previous = get().schemas;
    const removed = previous.find(s => String(s.id) === String(id));
    if (!removed) return;

    const remaining = previous.filter(s => String(s.id) !== String(id));
    set((state) => ({
      schemas: remaining,
      currentSchemaId: String(state.currentSchemaId) === String(id)
        ? (remaining[0]?.id ?? null)
        : state.currentSchemaId,
    }));

    if (isTemp(id)) return;

    try {
      await api.delete(`/schemas/${id}`);
      set((state) => ({ cache: { ...state.cache, [removed.project_id]: remaining } }));
    } catch (err) {
      set({ schemas: previous });
      throw err;
    }
  },

  setCurrentSchema: (id) => set({ currentSchemaId: id }),
}));
