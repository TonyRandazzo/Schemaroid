import api from '../services/api';
import { useShapeStore } from '../stores/shapeStore';
import { isComment } from '../components/canvas/CommentNode';
import { linkTarget } from '../components/canvas/shapeLayout';

const sameId = (a, b) => String(a) === String(b);

async function loadSchemaContent(schemaId) {
  const store = useShapeStore.getState();
  if (sameId(store.activeSchemaId, schemaId)) {
    return { shapes: store.shapes, connections: store.connections };
  }
  if (store.cache[schemaId]) return store.cache[schemaId];

  const [shapesRes, connRes] = await Promise.all([
    api.get(`/shapes/schema/${schemaId}`),
    api.get(`/connections/schema/${schemaId}`),
  ]);
  return { shapes: shapesRes.data, connections: connRes.data };
}

export async function loadSections(schemas) {
  const contents = await Promise.all(schemas.map(s => loadSchemaContent(s.id)));
  return schemas.map((schema, i) => ({ schema, ...contents[i] }));
}

// Lo schema di partenza seguito da tutti gli schemi che raggiunge tramite collegamenti,
// così i link interni dell'export hanno sempre una destinazione.
export async function loadLinkedSections(rootId, schemas) {
  const byId = new Map(schemas.map(s => [String(s.id), s]));
  const queue = [String(rootId)];
  const seen = new Set(queue);
  const sections = [];

  while (queue.length) {
    const schema = byId.get(queue.shift());
    if (!schema) continue;
    const content = await loadSchemaContent(schema.id);
    sections.push({ schema, ...content });

    for (const shape of content.shapes) {
      const target = linkTarget(shape.hyperlink);
      if (target?.schemaId && byId.has(target.schemaId) && !seen.has(target.schemaId)) {
        seen.add(target.schemaId);
        queue.push(target.schemaId);
      }
    }
  }
  return sections;
}

export function readingOrder(shapes) {
  return shapes
    .filter(s => !isComment(s))
    .slice()
    .sort((a, b) => (a.y ?? 0) - (b.y ?? 0) || (a.x ?? 0) - (b.x ?? 0));
}

export function normalizeUrl(url) {
  const trimmed = url.trim();
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function fileSlug(text) {
  return (text || 'schema')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
    .toLowerCase() || 'schema';
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
