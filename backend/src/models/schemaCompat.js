
const MISSING_COLUMN_RE = /Could not find the '(.+?)' column/;

export async function writeTolerant(run, payload) {
  const attempt = { ...payload };
  const dropped = [];

  for (let i = 0; i <= Object.keys(payload).length; i++) {
    const res = await run(attempt);
    const match = res.error?.message && MISSING_COLUMN_RE.exec(res.error.message);
    if (!match) {
      if (dropped.length) {
        console.warn(
          `[schema] colonne assenti nel database: ${dropped.join(', ')}. ` +
          'Salvato senza. Esegui backend/migrations/001_blueprint_nodes.sql per abilitarle.'
        );
      }
      return res;
    }
    const col = match[1];
    if (!(col in attempt)) return res;
    delete attempt[col];
    dropped.push(col);
  }

  return run(attempt);
}
