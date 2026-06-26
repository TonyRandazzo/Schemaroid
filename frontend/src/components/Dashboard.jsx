import { useRef, useState } from 'react';
import ProjectSelector from './projects/ProjectSelector';
import SchemaTabs from './schemas/SchemaTabs';
import BlueprintGrid from './canvas/BlueprintGrid';
import ProjectEditorModal from './modals/ProjectEditorModal';
import ProfileDropdown from './profile/ProfileDropdown';
import GuestBanner from './auth/GuestBanner';
import { useProjectStore } from '../stores/projectStore';
import { useSchemaStore } from '../stores/schemaStore';

export default function Dashboard() {
  const [addShapeTrigger, setAddShapeTrigger] = useState(0);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
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

  const handleDeleteProject = () => {
    setProjectMenuOpen(false);
    if (window.confirm(`Eliminare il progetto "${currentProject?.name}"? Tutti gli schemi e le forme saranno rimossi.`)) {
      deleteProject(currentProjectId);
      setCurrentProject(null);
      setCurrentSchema(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <GuestBanner />
      <header className="bg-white shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-blue-600">Schemaroid</h1>

          {/* Project selector + controls */}
          <div className="flex items-center gap-1">
            {renamingProject ? (
              <div className="flex items-center gap-1">
                <input
                  ref={renameRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingProject(false);
                  }}
                  className="border border-blue-400 rounded px-2 py-1 text-sm w-40 outline-none"
                />
                <button onClick={commitRename} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">OK</button>
                <button onClick={() => setRenamingProject(false)} className="text-xs text-gray-500">Annulla</button>
              </div>
            ) : (
              <ProjectSelector />
            )}

            {/* Project menu ("...") */}
            {currentProjectId && !renamingProject && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setProjectMenuOpen(o => !o)}
                  className="px-1.5 py-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded text-base leading-none"
                  title="Opzioni progetto"
                >
                  ⋯
                </button>
                {projectMenuOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-40">
                    <button
                      onClick={startRename}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Rinomina
                    </button>
                    <button
                      onClick={handleDeleteProject}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Elimina progetto
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setProjectModalOpen(true)}
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
            >
              + Progetto
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddShapeTrigger(t => t + 1)}
            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            + Aggiungi forma
          </button>
          <ProfileDropdown />
        </div>
      </header>

      <SchemaTabs />

      <div className="p-4">
        <BlueprintGrid addShapeTrigger={addShapeTrigger} />
      </div>

      <ProjectEditorModal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
      />
    </div>
  );
}
