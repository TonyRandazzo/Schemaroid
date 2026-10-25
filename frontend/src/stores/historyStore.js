import { create } from 'zustand';
import { useShapeStore } from './shapeStore';

const LIMIT = 100;

export const SHAPE_FIELDS = [
  'title', 'description', 'color', 'text_color', 'shape_type', 'hyperlink', 'image_url', 'x', 'y', 'width', 'height',
];

const TEXT_FIELDS = new Set(['title', 'description', 'hyperlink', 'image_url']);

// I testi mancanti diventano '' (così annullare può svuotarli); gli altri campi
// mancanti vengono omessi, perché il backend non accetta null per colori e misure.
export function pickFields(shape, fields = SHAPE_FIELDS) {
  const out = {};
  for (const f of fields) {
    const value = shape?.[f];
    if (value != null) out[f] = value;
    else if (TEXT_FIELDS.has(f)) out[f] = '';
  }
  return out;
}

// Annullare un'eliminazione ricrea la forma con un nuovo id: le voci successive
// continuano a usare l'id originale, risolto tramite questi alias.
const aliases = new Map();
const resolve = (id) => {
  let current = String(id);
  const seen = new Set();
  while (aliases.has(current) && !seen.has(current)) {
    seen.add(current);
    current = aliases.get(current);
  }
  return current;
};

async function createAll(schemaId, { shapes = [], connections = [] }) {
  const { addShape, addConnection } = useShapeStore.getState();
  for (const snap of shapes) {
    const created = await addShape({ ...pickFields(snap), schemaId });
    if (created?.id) aliases.set(String(snap.id), String(created.id));
  }
  for (const conn of connections) {
    const created = await addConnection(
      resolve(conn.source_shape_id),
      resolve(conn.target_shape_id),
      schemaId,
      conn.label ?? undefined,
      { source_handle: conn.source_handle, target_handle: conn.target_handle }
    );
    if (created?.id) aliases.set(String(conn.id), String(created.id));
  }
}

async function deleteAll({ shapes = [], connections = [] }) {
  const { deleteShape, deleteConnection } = useShapeStore.getState();
  const removed = new Set(shapes.map(s => String(s.id)));
  // I collegamenti di una forma eliminata se ne vanno insieme a lei.
  for (const conn of connections) {
    if (removed.has(String(conn.source_shape_id)) || removed.has(String(conn.target_shape_id))) continue;
    await deleteConnection(resolve(conn.id));
  }
  await Promise.all(shapes.map(s => deleteShape(resolve(s.id))));
}

async function applyUpdates(changes, side) {
  const { updateShape } = useShapeStore.getState();
  await Promise.all(changes.map(c => updateShape(resolve(c.id), c[side])));
}

function run(entry, direction) {
  const forward = direction === 'redo';
  switch (entry.kind) {
    case 'create': return forward ? createAll(entry.schemaId, entry) : deleteAll(entry);
    case 'delete': return forward ? deleteAll(entry) : createAll(entry.schemaId, entry);
    case 'update': return applyUpdates(entry.changes, forward ? 'after' : 'before');
    default: return Promise.resolve();
  }
}

const emptyStack = { undo: [], redo: [] };

export const useHistoryStore = create((set, get) => ({
  stacks: {},
  busy: false,

  /**
   * entry: { kind: 'create' | 'delete', shapes, connections }
   *      | { kind: 'update', changes: [{ id, before, after }] }
   * Gli snapshot sono già applicati: la voce serve solo per annullarli e ripeterli.
   */
  record: (schemaId, entry) => {
    if (!schemaId) return;
    if (entry.kind === 'update' && !entry.changes?.length) return;
    if (entry.kind !== 'update' && !entry.shapes?.length && !entry.connections?.length) return;

    set((state) => {
      const stack = state.stacks[schemaId] ?? emptyStack;
      return {
        stacks: {
          ...state.stacks,
          [schemaId]: { undo: [...stack.undo, { ...entry, schemaId }].slice(-LIMIT), redo: [] },
        },
      };
    });
  },

  canUndo: (schemaId) => !!get().stacks[schemaId]?.undo.length,
  canRedo: (schemaId) => !!get().stacks[schemaId]?.redo.length,

  undo: (schemaId) => get()._step(schemaId, 'undo'),
  redo: (schemaId) => get()._step(schemaId, 'redo'),

  _step: async (schemaId, direction) => {
    const stack = get().stacks[schemaId];
    const entry = stack?.[direction].at(-1);
    if (!entry || get().busy) return;
    if (String(useShapeStore.getState().activeSchemaId) !== String(schemaId)) return;

    const opposite = direction === 'undo' ? 'redo' : 'undo';
    set((state) => ({
      busy: true,
      stacks: {
        ...state.stacks,
        [schemaId]: { ...stack, [direction]: stack[direction].slice(0, -1) },
      },
    }));

    try {
      await run(entry, direction);
      set((state) => {
        const current = state.stacks[schemaId] ?? emptyStack;
        return {
          stacks: { ...state.stacks, [schemaId]: { ...current, [opposite]: [...current[opposite], entry] } },
        };
      });
    } catch (err) {
      const detail = err.response?.data?.error || err.message;
      alert(`${direction === 'undo' ? 'Annullamento' : 'Ripristino'} non riuscito: ${detail}`);
    } finally {
      set({ busy: false });
    }
  },
}));
