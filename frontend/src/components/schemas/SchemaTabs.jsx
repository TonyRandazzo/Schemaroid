import { useEffect, useRef, useState } from 'react';
import { useSchemaStore } from '../../stores/schemaStore';
import { useProjectStore } from '../../stores/projectStore';
import SchemaEditorModal from '../modals/SchemaEditorModal';

export default function SchemaTabs() {
  const { schemas, currentSchemaId, fetchSchemas, setCurrentSchema, deleteSchema, updateSchema } = useSchemaStore();
  const { currentProjectId } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);
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

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Eliminare questo schema? Le forme al suo interno saranno rimosse.')) {
      deleteSchema(id);
    }
  };

  if (!currentProjectId) {
    return <div className="p-4 text-gray-400 text-sm">Seleziona un progetto per vedere gli schemi</div>;
  }

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="flex items-center gap-1 overflow-x-auto px-2 pt-2">
        {schemas.map(s => (
          <div
            key={s.id}
            className={`group flex items-center gap-1 px-3 py-1.5 rounded-t-md cursor-pointer text-sm select-none border-b-2 transition-colors ${
              currentSchemaId === s.id
                ? 'bg-blue-50 text-blue-700 border-blue-500'
                : 'text-gray-600 border-transparent hover:bg-gray-50'
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
                className="w-24 text-sm border-b border-blue-400 outline-none bg-transparent"
              />
            ) : (
              <span onDoubleClick={(e) => startRename(e, s)}>{s.name}</span>
            )}

            {/* Actions — visible on hover or when current */}
            <span className={`flex items-center gap-0.5 ${currentSchemaId === s.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
              <button
                title="Rinomina"
                className="text-gray-400 hover:text-gray-700 px-0.5 text-xs"
                onClick={(e) => startRename(e, s)}
              >
                ✎
              </button>
              <button
                title="Elimina"
                className="text-gray-400 hover:text-red-500 px-0.5 text-xs"
                onClick={(e) => handleDelete(e, s.id)}
              >
                ×
              </button>
            </span>
          </div>
        ))}

        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-t-md whitespace-nowrap"
        >
          + Schema
        </button>
      </div>
      <SchemaEditorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
