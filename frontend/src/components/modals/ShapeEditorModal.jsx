import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../services/api';
import { useShapeStore } from '../../stores/shapeStore';
import { useSchemaStore } from '../../stores/schemaStore';

const SHAPES = [
  { value: 'rectangle', label: '▭', title: 'Rettangolo' },
  { value: 'square',    label: '□', title: 'Quadrato' },
  { value: 'circle',   label: '○', title: 'Cerchio' },
  { value: 'diamond',  label: '◇', title: 'Rombo' },
  { value: 'triangle', label: '△', title: 'Triangolo' },
];

export default function ShapeEditorModal({ isOpen, onClose, shape }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [shapeType, setShapeType] = useState('rectangle');
  const [linkType, setLinkType] = useState('url');
  const [hyperlink, setHyperlink] = useState('');
  const [linkedSchemaId, setLinkedSchemaId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { updateShape } = useShapeStore();
  const { currentSchemaId, schemas } = useSchemaStore();
  const otherSchemas = schemas.filter(s => String(s.id) !== String(currentSchemaId));

  useEffect(() => {
    if (shape) {
      setTitle(shape.title || '');
      setDescription(shape.description || '');
      setColor(shape.color || '#3B82F6');
      setShapeType(shape.shape_type || 'rectangle');
      setImageUrl(shape.image_url || '');
      const hlink = shape.hyperlink || '';
      if (hlink.startsWith('schema:')) {
        setLinkType('schema');
        setLinkedSchemaId(hlink.replace('schema:', ''));
        setHyperlink('');
      } else {
        setLinkType('url');
        setHyperlink(hlink);
        setLinkedSchemaId('');
      }
    }
  }, [shape]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);
      try {
        const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setImageUrl(res.data.url);
      } catch {
        alert('Upload fallito');
      } finally {
        setUploading(false);
      }
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resolvedHyperlink =
      linkType === 'schema'
        ? linkedSchemaId ? `schema:${linkedSchemaId}` : ''
        : hyperlink;

    try {
      await updateShape(shape.id, {
        title,
        description,
        color,
        shape_type: shapeType,
        hyperlink: resolvedHyperlink,
        image_url: imageUrl,
        x: shape.x,
        y: shape.y,
        schemaId: currentSchemaId,
      });
      onClose();
    } catch {
      alert('Errore nel salvare la forma');
    }
  };

  if (!shape) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Modifica forma</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Shape type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Forma</label>
          <div className="flex gap-1">
            {SHAPES.map(s => (
              <button
                key={s.value}
                type="button"
                title={s.title}
                className={`flex-1 py-2 text-xl rounded border transition-colors ${
                  shapeType === s.value
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                }`}
                onClick={() => setShapeType(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <Input label="Titolo (opzionale)" value={title} onChange={(e) => setTitle(e.target.value)} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Colore</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-12 p-0 border-0" />
        </div>

        {/* Hyperlink */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Collegamento ipertestuale</label>
          <div className="flex rounded border border-gray-300 overflow-hidden mb-2">
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm ${linkType === 'url' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setLinkType('url')}
            >
              URL esterno
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm ${linkType === 'schema' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setLinkType('schema')}
            >
              Schema del progetto
            </button>
          </div>
          {linkType === 'url' ? (
            <Input placeholder="https://..." value={hyperlink} onChange={(e) => setHyperlink(e.target.value)} />
          ) : (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              value={linkedSchemaId}
              onChange={(e) => setLinkedSchemaId(e.target.value)}
            >
              <option value="">— Nessuno —</option>
              {otherSchemas.map(s => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Immagine</label>
          <div {...getRootProps()} className="border-2 border-dashed p-4 rounded text-center cursor-pointer">
            <input {...getInputProps()} />
            {imageUrl
              ? <img src={imageUrl} alt="" className="max-h-24 mx-auto" />
              : <p className="text-gray-500">Trascina un'immagine o clicca per caricare</p>
            }
          </div>
          {uploading && <p className="text-sm text-gray-500">Caricamento...</p>}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit">Aggiorna</Button>
        </div>
      </form>
    </Modal>
  );
}
