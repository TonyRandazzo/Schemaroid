import { useEffect, useRef, useState } from 'react';
import { useSchemaStore } from '../../stores/schemaStore';
import { useProjectStore } from '../../stores/projectStore';
import SchemaEditorModal from '../modals/SchemaEditorModal';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function SchemaTabs() {
  const { schemas, currentSchemaId, fetchSchemas, setCurrentSchema, deleteSchema, updateSchema } = useSchemaStore();
  const { currentProjectId } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef(null);

  useEffect(() => {
    if (currentProjectId) fetchSchemas(currentProjectId);
  }, [currentProjectId]);

  useEffect(() => {
    if (renamingId && renameInputRef.current) renameInputRef.current.focus();
  }, [renamingId]);

  const startRename = (e, schema) => {
    e.stopPropagation();
    setRenamingId(schema.id);
    setRenameValue(schema.name);
  };

  const commitRename = async (id) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== schemas.find(s => s.id === id)?.name) {
      await updateSchema(id, { name: trimmed });
    }
    setRenamingId(null);
  };

  const askDelete = (e, schema) => {
    e.stopPropagation();
    setPendingDelete(schema);
  };

  if (!currentProjectId) {
    return (
      <div className="border-b border-line bg-surface px-5 py-3 text-sm text-fg-subtle">
        Seleziona un progetto per vedere gli schemi
      </div>
    );
  }

  return (
    <div className="border-b border-line bg-surface">
      <div className="flex items-center gap-1 overflow-x-auto px-4 pt-2">
        {schemas.map(s => {
          const isActive = currentSchemaId === s.id;
          return (
            <div
              key={s.id}
              className={`group flex items-center gap-1.5 px-3 py-2 rounded-t-lg cursor-pointer text-sm
                select-none border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-accent text-accent bg-accent-soft/40 font-medium'
                    : 'border-transparent text-fg-muted hover:text-fg hover:bg-surface-hover'
                }`}
              onClick={() => { if (renamingId !== s.id) setCurrentSchema(s.id); }}
            >
              {renamingId === s.id ? (
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={() => commitRename(s.id)}
                  onKeyDown={e => {
                    e.stopPropagation();
                    if (e.key === 'Enter') commitRename(s.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  onClick={e => e.stopPropagation()}
                  className="w-28 bg-transparent text-sm text-fg border-b border-accent outline-none"
                />
              ) : (
                <span onDoubleClick={(e) => startRename(e, s)}>{s.name}</span>
              )}

              <span className={`flex items-center gap-0.5 transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <button
                  title="Rinomina"
                  className="grid h-5 w-5 place-items-center rounded text-fg-subtle hover:text-fg hover:bg-surface-hover"
                  onClick={(e) => startRename(e, s)}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4v16h16v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  title="Elimina"
                  className="grid h-5 w-5 place-items-center rounded text-fg-subtle hover:text-danger hover:bg-danger-soft"
                  onClick={(e) => askDelete(e, s)}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </span>
            </div>
          );
        })}

        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-2 text-sm font-medium text-accent rounded-t-lg whitespace-nowrap
            hover:bg-surface-hover transition-colors"
        >
          + Schema
        </button>
      </div>
      <SchemaEditorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => deleteSchema(pendingDelete.id)}
        title={`Eliminare lo schema "${pendingDelete?.name ?? ''}"?`}
        message="Le forme e i collegamenti al suo interno saranno rimossi. L'operazione non è reversibile."
        confirmLabel="Elimina schema"
      />
    </div>
  );
}
