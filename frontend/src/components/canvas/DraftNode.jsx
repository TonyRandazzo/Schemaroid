import { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import api from '../../services/api';
import { useSchemaStore } from '../../stores/schemaStore';
import { useRecentColorsStore } from '../../stores/recentColorsStore';
import ColorPicker from '../ui/ColorPicker';
import { DEFAULT_SHAPE_COLOR, DEFAULT_TEXT_COLOR } from './ShapeNode';

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
  const addRecent = useRecentColorsStore((s) => s.addRecent);

  const parsed = parseHyperlink(initialData?.hyperlink);

  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || DEFAULT_SHAPE_COLOR);
  const [textColor, setTextColor] = useState(initialData?.text_color || DEFAULT_TEXT_COLOR);
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

  const [saving, setSaving] = useState(false);

  const confirm = useCallback(async () => {
    const resolvedHyperlink =
      linkType === 'schema'
        ? (linkedSchemaId ? `schema:${linkedSchemaId}` : '')
        : hyperlink;
    setSaving(true);
    try {
      await onConfirm({
        title, description, color, text_color: textColor,
        shape_type: shapeType, hyperlink: resolvedHyperlink, image_url: imageUrl,
      });
      addRecent('fill', color);
      addRecent('text', textColor);
    } catch (err) {
      const detail = err.response?.data?.error
        || err.response?.data?.errors?.[0]?.msg
        || err.message;
      alert(`Salvataggio non riuscito: ${detail}`);
    } finally {
      setSaving(false);
    }
  }, [title, description, color, textColor, shapeType, linkType, hyperlink, linkedSchemaId, imageUrl, onConfirm, addRecent]);

  const stop = (e) => e.stopPropagation();

  return (
    <div
      className="bg-surface-raised border border-line rounded-xl p-3.5
        shadow-2xl shadow-[rgb(var(--shadow-color)/0.25)] ring-1 ring-accent/30"
      style={{ width: 280 }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />

      <div className="text-[10px] font-semibold text-fg-subtle uppercase tracking-widest mb-2.5">
        {isEditing ? 'Modifica forma' : 'Nuova forma'}
      </div>

      <div className="flex gap-1 mb-2.5">
        {SHAPES.map(s => (
          <button
            key={s.value}
            type="button"
            title={s.title}
            className={`nodrag flex-1 py-1 text-lg rounded-md transition-colors ${
              shapeType === s.value
                ? 'bg-accent-soft text-accent-soft-fg'
                : 'text-fg-subtle hover:bg-surface-hover hover:text-fg'
            }`}
            onClick={() => setShapeType(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder="Titolo (opzionale)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { stop(e); if (e.key === 'Escape') onCancel(); }}
        className="nodrag nowheel mb-2.5 w-full bg-transparent text-sm text-fg placeholder:text-fg-subtle
          border-b border-line py-0.5 outline-none focus:border-accent transition-colors"
      />

      <div className="mb-2.5 space-y-1.5">
        <div className="nodrag nowheel flex items-center gap-1.5">
          <span className="w-11 shrink-0 text-[10px] uppercase tracking-wider text-fg-subtle">Sfondo</span>
          <ColorPicker kind="fill" value={color} onChange={setColor} compact title="Colore di riempimento" />
        </div>
        <div className="nodrag nowheel flex items-center gap-1.5">
          <span className="w-11 shrink-0 text-[10px] uppercase tracking-wider text-fg-subtle">Testo</span>
          <ColorPicker kind="text" value={textColor} onChange={setTextColor} compact badge="A" title="Colore del testo" />
        </div>
      </div>

      <textarea
        placeholder="Descrizione (opzionale)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        onKeyDown={stop}
        rows={2}
        className="nodrag nowheel field mb-2.5 resize-none py-1.5"
      />

      <div className="mb-2.5">
        <div className="mb-1.5 flex rounded-lg border border-line p-0.5 text-xs">
          {[
            { key: 'url', label: 'URL esterno' },
            { key: 'schema', label: 'Schema progetto' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`nodrag flex-1 rounded-md py-1 transition-colors ${
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
          <input
            type="text"
            placeholder="https://..."
            value={hyperlink}
            onChange={(e) => setHyperlink(e.target.value)}
            onKeyDown={stop}
            className="nodrag nowheel field py-1.5"
          />
        ) : (
          <select
            value={linkedSchemaId}
            onChange={(e) => setLinkedSchemaId(e.target.value)}
            className="nodrag nowheel field py-1.5"
          >
            <option value="">— Nessuno —</option>
            {otherSchemas.map(s => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="mb-3.5 flex items-center gap-2">
        {imageUrl && (
          <img src={imageUrl} alt="" className="h-10 w-16 shrink-0 rounded-md border border-line object-cover" />
        )}
        <label className="nodrag nowheel flex cursor-pointer items-center gap-1 text-xs text-fg-muted">
          <span className="rounded-md bg-surface-sunken px-2.5 py-1.5 whitespace-nowrap transition-colors hover:bg-surface-hover">
            {uploading ? 'Caricamento…' : imageUrl ? 'Cambia' : '+ Immagine'}
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
        {imageUrl && (
          <button
            type="button"
            className="nodrag text-xs text-fg-subtle transition-colors hover:text-danger"
            onClick={() => setImageUrl('')}
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="nodrag btn btn-secondary btn-sm flex-1">
          Annulla
        </button>
        <button type="button" onClick={confirm} disabled={saving} className="nodrag btn btn-primary btn-sm flex-1">
          {saving ? 'Salvataggio…' : isEditing ? 'Aggiorna' : 'Crea'}
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  );
}
