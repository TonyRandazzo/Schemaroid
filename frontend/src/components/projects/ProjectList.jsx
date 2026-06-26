import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import ProjectEditorModal from '../modals/ProjectEditorModal';

export default function ProjectList() {
  const { projects, deleteProject, setCurrentProject } = useProjectStore();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">I tuoi progetti</h3>
        <Button onClick={() => setModalOpen(true)}>Nuovo progetto</Button>
      </div>
      <ul className="space-y-2">
        {projects.map(p => (
          <li key={p.id} className="flex justify-between items-center border p-2 rounded">
            <span className="cursor-pointer hover:text-blue-600" onClick={() => setCurrentProject(p.id)}>{p.name}</span>
            <div>
              <button className="text-sm text-red-600 mr-2" onClick={() => deleteProject(p.id)}>Elimina</button>
            </div>
          </li>
        ))}
      </ul>
      <ProjectEditorModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}