import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useSchemaStore } from '../../stores/schemaStore';
import { useProjectStore } from '../../stores/projectStore';

export default function SchemaEditorModal({ isOpen, onClose }) {
  const [name, setName] = useState('');
  const { createSchema } = useSchemaStore();
  const { currentProjectId } = useProjectStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !currentProjectId) return;
    await createSchema(currentProjectId, name);
    setName('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-semibold text-fg mb-5">Nuovo schema</h2>
      <form onSubmit={handleSubmit}>
        <Input label="Nome schema" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit">Crea</Button>
        </div>
      </form>
    </Modal>
  );
}