import { Handle, Position } from 'reactflow';
import { useSchemaStore } from '../../stores/schemaStore';

const SIZES = {
  rectangle: { w: 150, h: 80 },
  square:    { w: 100, h: 100 },
  circle:    { w: 100, h: 100 },
  diamond:   { w: 130, h: 130 },
  triangle:  { w: 130, h: 110 },
};

// Padding (top right bottom left) to keep text inside each shape
const TEXT_PAD = {
  rectangle: '8px 14px',
  square:    '14px',
  circle:    '22px',
  diamond:   '38px 36px',
  triangle:  '58px 22px 8px',
};

function getBorderColor(hyperlink) {
  if (!hyperlink) return '#1e293b';
  return hyperlink.startsWith('schema:') ? '#f97316' : '#2563eb';
}

function ShapeSVG({ type, w, h, fill, stroke }) {
  const sw = 3, hs = sw / 2;
  if (type === 'circle') {
    const r = Math.min(w, h) / 2 - hs;
    return <svg width={w} height={h}><circle cx={w/2} cy={h/2} r={r} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
  }
  if (type === 'diamond') {
    const pts = `${w/2},${hs} ${w-hs},${h/2} ${w/2},${h-hs} ${hs},${h/2}`;
    return <svg width={w} height={h}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
  }
  if (type === 'triangle') {
    const pts = `${w/2},${hs} ${w-hs},${h-hs} ${hs},${h-hs}`;
    return <svg width={w} height={h}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
  }
  const rx = type === 'square' ? 2 : 8;
  return <svg width={w} height={h}><rect x={hs} y={hs} width={w-sw} height={h-sw} rx={rx} fill={fill} stroke={stroke} strokeWidth={sw} /></svg>;
}

export default function ShapeNode({ data, id }) {
  const { title, description, color, image_url, hyperlink, onEdit, shape_type } = data;
  const { schemas, setCurrentSchema } = useSchemaStore();

  const type = shape_type || 'rectangle';
  const { w, h } = SIZES[type] || SIZES.rectangle;
  const borderColor = getBorderColor(hyperlink);

  const isSchemaLink = hyperlink?.startsWith('schema:');
  const linkedSchemaId = isSchemaLink ? hyperlink.replace('schema:', '') : null;
  const linkedSchema = linkedSchemaId ? schemas.find(s => String(s.id) === linkedSchemaId) : null;

  const handleLinkClick = (e) => {
    if (isSchemaLink) {
      e.preventDefault();
      if (linkedSchema) setCurrentSchema(linkedSchema.id);
    }
  };

  return (
    <div style={{ position: 'relative', width: w, height: h }}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      {/* SVG shape */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <ShapeSVG type={type} w={w} h={h} fill={color || '#3B82F6'} stroke={borderColor} />
      </div>

      {/* Content overlay */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: TEXT_PAD[type] || TEXT_PAD.rectangle,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        {image_url && (
          <img src={image_url} alt="" style={{ width: '100%', height: 28, objectFit: 'cover', borderRadius: 3, marginBottom: 2 }} />
        )}
        {title && (
          <div style={{ fontWeight: 700, color: '#fff', fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
            {title}
          </div>
        )}
        {description && (
          <div style={{ color: '#fff', opacity: 0.85, fontSize: 10, textAlign: 'center', marginTop: 2 }}>
            {description}
          </div>
        )}
        {hyperlink && (
          <a
            href={isSchemaLink ? '#' : hyperlink}
            target={isSchemaLink ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            style={{ pointerEvents: 'auto', color: '#bfdbfe', fontSize: 10, textDecoration: 'underline', marginTop: 2, display: 'block', textAlign: 'center' }}
          >
            {isSchemaLink ? (linkedSchema?.name || 'Schema') : 'Link'}
          </a>
        )}
        <button
          className="nodrag"
          style={{
            pointerEvents: 'auto',
            marginTop: 4,
            fontSize: 10,
            background: 'rgba(255,255,255,0.28)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            padding: '2px 8px',
            cursor: 'pointer',
          }}
          onClick={() => onEdit(id)}
        >
          Modifica
        </button>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
