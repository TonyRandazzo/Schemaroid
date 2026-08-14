import { useState } from 'react';
import { Handle, Position, NodeResizer, useStore } from 'reactflow';
import { useSchemaStore } from '../../stores/schemaStore';
import { useThemeStore } from '../../stores/themeStore';

export const DEFAULT_SIZES = {
  rectangle: { w: 180, h: 90 },
  square:    { w: 110, h: 110 },
  circle:    { w: 110, h: 110 },
  diamond:   { w: 140, h: 140 },
  triangle:  { w: 140, h: 120 },
};

const MIN_SIZES = {
  rectangle: { w: 90,  h: 52 },
  square:    { w: 60,  h: 60 },
  circle:    { w: 60,  h: 60 },
  diamond:   { w: 80,  h: 80 },
  triangle:  { w: 80,  h: 70 },
};

const LOCKED_RATIO = new Set(['circle', 'square']);

const TEXT_PAD = {
  rectangle: '8px 12px',
  square:    '12px',
  circle:    '16%',
  diamond:   '22%',
  triangle:  '42% 16% 8%',
};

export const DEFAULT_SHAPE_COLOR = '#343A52';
export const DEFAULT_TEXT_COLOR = '#F5F5F5';

function getBorderColor(hyperlink, isDark) {
  if (!hyperlink) return isDark ? '#AEB5C7' : '#2A2F3E';
  return hyperlink.startsWith('schema:') ? '#F0A500' : '#EE2B48';
}

function ShapeSVG({ type, w, h, fill, stroke }) {
  const sw = 2.5, hs = sw / 2;
  if (!w || !h) return null;

  if (type === 'circle') {
    return (
      <svg width={w} height={h}>
        <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - hs} ry={h / 2 - hs} fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }
  if (type === 'diamond') {
    const pts = `${w / 2},${hs} ${w - hs},${h / 2} ${w / 2},${h - hs} ${hs},${h / 2}`;
    return <svg width={w} height={h}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /></svg>;
  }
  if (type === 'triangle') {
    const pts = `${w / 2},${hs} ${w - hs},${h - hs} ${hs},${h - hs}`;
    return <svg width={w} height={h}><polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" /></svg>;
  }
  const rx = type === 'square' ? 4 : 10;
  return (
    <svg width={w} height={h}>
      <rect x={hs} y={hs} width={w - sw} height={h - sw} rx={rx} fill={fill} stroke={stroke} strokeWidth={sw} />
    </svg>
  );
}

const PINS = [
  { id: 'top',    position: Position.Top },
  { id: 'right',  position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left',   position: Position.Left },
];

export default function ShapeNode({ data, id, selected }) {
  const { title, description, color, text_color, image_url, hyperlink, onEdit, shape_type } = data;
  const { schemas, setCurrentSchema } = useSchemaStore();
  const isDark = useThemeStore((s) => s.theme === 'dark');
  const [hovered, setHovered] = useState(false);

  const type = shape_type || 'rectangle';
  const min = MIN_SIZES[type] || MIN_SIZES.rectangle;

  const { w, h } = useStore(
    (s) => {
      const n = s.nodeInternals.get(id);
      const fallback = DEFAULT_SIZES[type] || DEFAULT_SIZES.rectangle;
      return { w: n?.width ?? fallback.w, h: n?.height ?? fallback.h };
    },
    (a, b) => a.w === b.w && a.h === b.h
  );

  const borderColor = getBorderColor(hyperlink, isDark);
  const fg = text_color || DEFAULT_TEXT_COLOR;

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
    <div
      className="group"
      style={{ position: 'relative', width: '100%', height: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      pe-resize-handle"
      />

      {PINS.map(({ id: pinId, position }) => (
        <Handle
          key={pinId}
          id={pinId}
          type="source"
          position={position}
          className="shape-pin"
        />
      ))}

      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <ShapeSVG type={type} w={w} h={h} fill={color || DEFAULT_SHAPE_COLOR} stroke={borderColor} />
      </div>

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
          <img src={image_url} alt="" style={{ width: '100%', height: 28, objectFit: 'cover', borderRadius: 3, marginBottom: 3 }} />
        )}
        {title && (
          <div style={{ fontWeight: 700, color: fg, fontSize: 12, textAlign: 'center', lineHeight: 1.2 }}>
            {title}
          </div>
        )}
        {description && (
          <div style={{ color: fg, opacity: 0.85, fontSize: 10, textAlign: 'center', marginTop: 2 }}>
            {description}
          </div>
        )}
        {hyperlink && (
          <a
            href={isSchemaLink ? '#' : hyperlink}
            target={isSchemaLink ? undefined : '_blank'}
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            style={{
              pointerEvents: 'auto', color: fg, opacity: 0.9, fontSize: 10,
              textDecoration: 'underline', marginTop: 2, textAlign: 'center',
            }}
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
            background: 'rgba(255,255,255,0.25)',
            color: fg,
            border: '1px solid rgba(255,255,255,0.35)',
            borderRadius: 5,
            padding: '2px 8px',
            cursor: 'pointer',
            backdropFilter: 'blur(2px)',
          }}
          onClick={() => onEdit(id)}
        >
          Modifica
        </button>
      </div>
    </div>
  );
}
