import { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import api from '../../services/api';
import { useSchemaStore } from '../../stores/schemaStore';

const SHAPES = [
  { value: 'rectangle', label: '▭', title: 'Rettangolo' },
  { value: 'square',    label: '□', title: 'Quadrato' },
  { value: 'circle',   label: '○', title: 'Cerchio' },
  { value: 'diamond',  label: '◇', title: 'Rombo' },
  { value: 'triangle', label: '△', title: 'Triangolo' },
];

function parseHyperlink(raw = '') {
  if (raw.startsWith('schema:')) return { linkType: 'schema', hyperlink: '', linkedSchemaId: raw.replace('schema:', '') };
  return { linkType: 'url', hyperlink: raw, linkedSchemaId: '' };
}

export default function DraftNode({ data }) {
  const { onConfirm, onCancel, initialData, isEditing } = data;
  const { schemas, currentSchemaId } = useSchemaStore();

  const parsed = parseHyperlink(initialData?.hyperlink);

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || '#3B82F6');
  const [shapeType, setShapeType] = useState(initialData?.shape_type || 'rectangle');
  const [linkType, setLinkType] = useState(parsed.linkType);
  const [hyperlink, setHyperlink] = useState(parsed.hyperlink);
  const [linkedSchemaId, setLinkedSchemaId] = useState(parsed.linkedSchemaId);
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [uploading, setUploading] = useState(false);

  const otherSchemas = schemas.filter(s => String(s.id) !== String(currentSchemaId));

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('image', file);
    try {
      const res = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImageUrl(res.data.url);
    } catch {
      alert('Upload fallito');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, []);

  const confirm = useCallback(() => {
    const resolvedHyperlink =
      linkType === 'schema'
        ? (linkedSchemaId ? `schema:${linkedSchemaId}` : '')
        : hyperlink;
    onConfirm({ title, description, color, shape_type: shapeType, hyperlink: resolvedHyperlink, image_url: imageUrl });
  }, [title, description, color, shapeType, linkType, hyperlink, linkedSchemaId, imageUrl, onConfirm]);

  const stop = (e) => e.stopPropagation();

  return (
    <div className="bg-white border-2 border-dashed border-blue-400 rounded-xl shadow-2xl p-3" style={{ width: 272 }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {isEditing ? 'Modifica forma' : 'Nuova forma'}
      </div>

      {/* Shape type */}
      <div className="flex gap-1 mb-2">
        {SHAPES.map(s => (
          <button
            key={s.value}
            type="button"
            title={s.title}
            className={`nodrag flex-1 py-1 text-lg rounded transition-colors ${
              shapeType === s.value ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-400'
            }`}
            onClick={() => setShapeType(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Color + Title */}
      <div className="flex items-center gap-2 mb-2">
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="nodrag nowheel w-7 h-7 border-0 p-0 rounded cursor-pointer shrink-0"
          title="Colore"
        />
        <input
          type="text"
          placeholder="Titolo (opzionale)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { stop(e); if (e.key === 'Escape') onCancel(); }}
          className="nodrag nowheel flex-1 text-sm border-b border-gray-200 outline-none py-0.5 bg-transparent"
        />
      </div>

      {/* Description */}
      <textarea
        placeholder="Descrizione (opzionale)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={stop}
        rows={2}
        className="nodrag nowheel w-full text-sm border border-gray-200 rounded px-2 py-1 mb-2 resize-none outline-none focus:border-blue-300"
      />

      {/* Hyperlink */}
      <div className="mb-2">
        <div className="flex rounded border border-gray-200 overflow-hidden mb-1 text-xs">
          <button
            type="button"
            className={`nodrag flex-1 py-1 ${linkType === 'url' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setLinkType('url')}
          >
            URL esterno
          </button>
          <button
            type="button"
            className={`nodrag flex-1 py-1 ${linkType === 'schema' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setLinkType('schema')}
          >
            Schema progetto
          </button>
        </div>
        {linkType === 'url' ? (
          <input
            type="text"
            placeholder="https://..."
            value={hyperlink}
            onChange={(e) => setHyperlink(e.target.value)}
            onKeyDown={stop}
            className="nodrag nowheel w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-300"
          />
        ) : (
          <select
            value={linkedSchemaId}
            onChange={(e) => setLinkedSchemaId(e.target.value)}
            className="nodrag nowheel w-full text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-blue-300 bg-white"
          >
            <option value="">— Nessuno —</option>
            {otherSchemas.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Image */}
      <div className="mb-3 flex items-center gap-2">
        {imageUrl && (
          <img src={imageUrl} alt="" className="h-10 w-16 object-cover rounded shrink-0" />
        )}
        <label className="nodrag nowheel flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
          <span className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 whitespace-nowrap">
            {uploading ? 'Caricamento…' : imageUrl ? 'Cambia' : '+ Immagine'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
        {imageUrl && (
          <button type="button" className="nodrag text-red-400 hover:text-red-600 text-xs" onClick={() => setImageUrl('')}>
            ✕
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="nodrag flex-1 text-xs py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-gray-700">
          Annulla
        </button>
        <button type="button" onClick={confirm} className="nodrag flex-1 text-xs py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600">
          {isEditing ? 'Aggiorna' : 'Crea'}
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
