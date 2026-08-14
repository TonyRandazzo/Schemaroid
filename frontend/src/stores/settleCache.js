const sameId = (a, b) => String(a) === String(b);

export function settle(state, schemaId, next) {
  if (!schemaId) return next;

  if (!sameId(state.activeSchemaId, schemaId)) {
    const { [schemaId]: _discarded, ...rest } = state.cache;
    return { cache: rest };
  }

  const shapes = next.shapes ?? state.shapes;
  const connections = next.connections ?? state.connections;
  return { ...next, cache: { ...state.cache, [schemaId]: { shapes, connections } } };
}
