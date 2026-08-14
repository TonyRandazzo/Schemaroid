import { useRef, useState } from 'react';
import ProjectSelector from './projects/ProjectSelector';
import SchemaTabs from './schemas/SchemaTabs';
import BlueprintGrid from './canvas/BlueprintGrid';
import ProjectEditorModal from './modals/ProjectEditorModal';
import ProfileDropdown from './profile/ProfileDropdown';
import GuestBanner from './auth/GuestBanner';
import ThemeToggle from './ui/ThemeToggle';
import Button from './ui/Button';
import ConfirmDialog from './ui/ConfirmDialog';
import { useProjectStore } from '../stores/projectStore';
import { useSchemaStore } from '../stores/schemaStore';

export default function Dashboard() {
  const [addShapeTrigger, setAddShapeTrigger] = useState(0);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [renamingProject, setRenamingProject] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const renameRef = useRef(null);
  const menuRef = useRef(null);

  const { projects, currentProjectId, renameProject, deleteProject, setCurrentProject } = useProjectStore();
  const { setCurrentSchema } = useSchemaStore();

  const currentProject = projects.find(p => p.id === currentProjectId);

  const startRename = () => {
    setProjectMenuOpen(false);
    setRenameValue(currentProject?.name || '');
    setRenamingProject(true);
    setTimeout(() => renameRef.current?.focus(), 50);
  };

  const commitRename = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== currentProject?.name) {
      await renameProject(currentProjectId, trimmed);
    }
    setRenamingProject(false);
  };

  const confirmDeleteProject = async () => {
    await deleteProject(currentProjectId);
    setCurrentProject(null);
    setCurrentSchema(null);
  };

  return (
    <div className="min-h-screen bg-canvas">
      <GuestBanner />

      <header className="sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-line">
        <div className="px-5 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-fg text-sm font-bold">
                S
              </span>
              <h1 className="text-base font-semibold tracking-tight text-fg">Schemaroid</h1>
            </div>

            <div className="h-6 w-px bg-line" />

            <div className="flex items-center gap-1.5">
              {renamingProject ? (
                <div className="flex items-center gap-1.5">
                  <input
                    ref={renameRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitRename();
                      if (e.key === 'Escape') setRenamingProject(false);
                    }}
                    className="field w-44 py-1.5"
                  />
                  <Button size="sm" onClick={commitRename}>OK</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenamingProject(false)}>Annulla</Button>
                </div>
              ) : (
                <ProjectSelector />
              )}

              {currentProjectId && !renamingProject && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setProjectMenuOpen(o => !o)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-fg-subtle
                      hover:bg-surface-hover hover:text-fg transition-colors"
                    title="Opzioni progetto"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
                    </svg>
                  </button>
                  {projectMenuOpen && (
                    <div className="menu absolute left-0 top-full mt-1.5 w-44">
                      <button onClick={startRename} className="menu-item">Rinomina</button>
                      <button
                        onClick={() => { setProjectMenuOpen(false); setDeleteProjectOpen(true); }}
                        className="menu-item menu-item-danger"
                      >
                        Elimina progetto
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Button size="sm" variant="secondary" onClick={() => setProjectModalOpen(true)}>
                + Progetto
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button size="sm" onClick={() => setAddShapeTrigger(t => t + 1)}>
              + Aggiungi forma
            </Button>
            <ThemeToggle />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <SchemaTabs />

      <div className="p-5">
        <BlueprintGrid addShapeTrigger={addShapeTrigger} />
      </div>

      <ProjectEditorModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteProjectOpen}
        onClose={() => setDeleteProjectOpen(false)}
        onConfirm={confirmDeleteProject}
        title={`Eliminare "${currentProject?.name ?? 'il progetto'}"?`}
        message="Tutti gli schemi e le forme contenuti saranno rimossi. L'operazione non è reversibile."
        confirmLabel="Elimina progetto"
      />
    </div>
  );
}
