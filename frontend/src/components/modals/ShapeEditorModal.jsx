import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import api from '../../services/api';
import { useShapeStore } from '../../stores/shapeStore';
import { useSchemaStore } from '../../stores/schemaStore';
import { useRecentColorsStore } from '../../stores/recentColorsStore';
import ColorPicker from '../ui/ColorPicker';
import { DEFAULT_SHAPE_COLOR, DEFAULT_TEXT_COLOR } from '../canvas/ShapeNode';

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
  const [color, setColor] = useState(DEFAULT_SHAPE_COLOR);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT_COLOR);
  const [shapeType, setShapeType] = useState('rectangle');
  const [linkType, setLinkType] = useState('url');
  const [hyperlink, setHyperlink] = useState('');
  const [linkedSchemaId, setLinkedSchemaId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { updateShape } = useShapeStore();
  const addRecent = useRecentColorsStore((s) => s.addRecent);
  const { currentSchemaId, schemas } = useSchemaStore();
  const otherSchemas = schemas.filter(s => String(s.id) !== String(currentSchemaId));

  useEffect(() => {
    if (shape) {
      setTitle(shape.title || '');
      setDescription(shape.description || '');
      setColor(shape.color || DEFAULT_SHAPE_COLOR);
      setTextColor(shape.text_color || '#FFFFFF');
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
        text_color: textColor,
        shape_type: shapeType,
        hyperlink: resolvedHyperlink,
        image_url: imageUrl,
        x: shape.x,
        y: shape.y,
        schemaId: currentSchemaId,
      });
      addRecent('fill', color);
      addRecent('text', textColor);
      onClose();
    } catch (err) {
      alert(`Errore nel salvare la forma: ${err.response?.data?.error || err.message}`);
    }
  };

  if (!shape) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-semibold text-fg mb-5">Modifica forma</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Forma</label>
          <div className="flex gap-1">
            {SHAPES.map(s => (
              <button
                key={s.value}
                type="button"
                title={s.title}
                className={`flex-1 py-2 text-xl rounded-lg border transition-colors ${
                  shapeType === s.value
                    ? 'border-accent bg-accent-soft text-accent-soft-fg'
                    : 'border-line text-fg-subtle hover:bg-surface-hover hover:text-fg'
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
          <label className="label">Descrizione</label>
          <textarea
            className="field resize-none"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="label">Riempimento</label>
            <ColorPicker kind="fill" value={color} onChange={setColor} title="Colore di riempimento" />
          </div>
          <div>
            <label className="label">Colore del testo</label>
            <ColorPicker kind="text" value={textColor} onChange={setTextColor} badge="A" title="Colore del testo" />
          </div>
          <div className="col-span-2">
            <label className="label">Anteprima</label>
            <div
              className="grid h-12 place-items-center rounded-lg border border-line text-sm font-semibold"
              style={{ background: color, color: textColor }}
            >
              {title || 'Testo'}
            </div>
          </div>
        </div>

        <div>
          <label className="label">Collegamento ipertestuale</label>
          <div className="mb-2 flex rounded-lg border border-line p-0.5">
            {[
              { key: 'url', label: 'URL esterno' },
              { key: 'schema', label: 'Schema del progetto' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`flex-1 rounded-md py-1.5 text-sm transition-colors ${
                  linkType === key
                    ? 'bg-accent text-accent-fg font-medium'
                    : 'text-fg-muted hover:bg-surface-hover'
                }`}
                onClick={() => setLinkType(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {linkType === 'url' ? (
            <Input placeholder="https://..." value={hyperlink} onChange={(e) => setHyperlink(e.target.value)} />
          ) : (
            <select
              className="field"
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

        <div>
          <label className="label">Immagine</label>
          <div
            {...getRootProps()}
            className="cursor-pointer rounded-lg border-2 border-dashed border-line bg-surface-sunken p-5
              text-center transition-colors hover:border-accent hover:bg-accent-soft/30"
          >
            <input {...getInputProps()} />
            {imageUrl
              ? <img src={imageUrl} alt="" className="mx-auto max-h-24 rounded-md" />
              : <p className="text-sm text-fg-muted">Trascina un'immagine o clicca per caricare</p>
            }
          </div>
          {uploading && <p className="mt-1.5 text-sm text-fg-muted">Caricamento…</p>}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Annulla</Button>
          <Button type="submit">Aggiorna</Button>
        </div>
      </form>
    </Modal>
  );
}
