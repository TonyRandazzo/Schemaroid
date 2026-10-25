import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import { useProjectStore } from '../../stores/projectStore';
import { useSchemaStore } from '../../stores/schemaStore';

const FORMATS = [
  { key: 'pdf', label: 'PDF', hint: 'schema grafico' },
  { key: 'png', label: 'Immagine PNG' },
  { key: 'drawio', label: 'diagrams.net', hint: '.drawio modificabile' },
  { key: 'pdf-text', label: 'PDF testuale', hint: 'elenco con link' },
];

export default function ExportMenu() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const { projects, currentProjectId } = useProjectStore();
  const { schemas, currentSchemaId } = useSchemaStore();
  const project = projects.find(p => p.id === currentProjectId);
  const currentSchema = schemas.find(s => s.id === currentSchemaId);

  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const run = async (scope, format) => {
    setOpen(false);
    setBusy(true);
    try {
      const { runExport } = await import('../../export');
      await runExport({ format, scope, project, schemas, schemaId: currentSchemaId });
    } catch (err) {
      alert(`Esportazione non riuscita: ${err.response?.data?.error || err.message}`);
    } finally {
      setBusy(false);
    }
  };

  if (!currentProjectId) return null;

  const groups = [
    { scope: 'schema', title: currentSchema ? `Schema "${currentSchema.name}"` : 'Schema corrente', disabled: !currentSchema },
    { scope: 'project', title: 'Intero progetto', disabled: !schemas.length },
  ];

  return (
    <div className="relative" ref={ref}>
      <Button size="sm" variant="secondary" onClick={() => setOpen(o => !o)} disabled={busy}>
        {busy ? 'Esportazione…' : 'Esporta'}
      </Button>
      {open && (
        <div className="menu absolute right-0 top-full mt-1.5 w-64">
          {groups.map(({ scope, title, disabled }, i) => (
            <div key={scope}>
              {i > 0 && <div className="my-1.5 h-px bg-line" />}
              <div className="truncate px-3.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
                {title}
              </div>
              {FORMATS.map(f => (
                <button
                  key={f.key}
                  disabled={disabled}
                  onClick={() => run(scope, f.key)}
                  className="menu-item flex items-center justify-between gap-4 disabled:pointer-events-none disabled:opacity-40"
                >
                  {f.label}
                  {f.hint && <span className="text-xs text-fg-subtle">{f.hint}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
