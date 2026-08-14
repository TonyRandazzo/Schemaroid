import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import Button from '../ui/Button';
import ProjectEditorModal from '../modals/ProjectEditorModal';
import ConfirmDialog from '../ui/ConfirmDialog';

export default function ProjectList() {
  const { projects, deleteProject, setCurrentProject } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  return (
    <div className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-fg">I tuoi progetti</h3>
        <Button size="sm" onClick={() => setModalOpen(true)}>Nuovo progetto</Button>
      </div>

      {projects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line py-8 text-center text-sm text-fg-muted">
          Nessun progetto. Creane uno per iniziare.
        </p>
      ) : (
        <ul className="space-y-2">
          {projects.map(p => (
            <li
              key={p.id}
              className="card flex items-center justify-between px-4 py-2.5 transition-colors hover:border-line-strong"
            >
              <button
                className="text-sm text-fg transition-colors hover:text-accent"
                onClick={() => setCurrentProject(p.id)}
              >
                {p.name}
              </button>
              <Button size="sm" variant="danger" onClick={() => setPendingDelete(p)}>
                Elimina
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ProjectEditorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => deleteProject(pendingDelete.id)}
        title={`Eliminare "${pendingDelete?.name ?? ''}"?`}
        message="Tutti gli schemi e le forme contenuti saranno rimossi. L'operazione non è reversibile."
        confirmLabel="Elimina progetto"
      />
    </div>
  );
}
