import { useEffect, useRef, useState } from 'react';
import { Handle, Position, NodeResizer, useStore } from 'reactflow';
import { useSchemaStore } from '../../stores/schemaStore';
import { useThemeStore } from '../../stores/themeStore';
import {
  DEFAULT_SIZES, MIN_SIZES, LOCKED_RATIO, CONTENT_STYLE, IMAGE_STYLE, TITLE_STYLE, DESCRIPTION_STYLE,
  LINK_STYLE, EDIT_BUTTON_STYLE, textBoxFor, shapeContent, fitShapeSize,
} from './shapeLayout';

export { DEFAULT_SIZES };

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
  const { title, description, color, text_color, image_url, hyperlink, onEdit, onAutoFit, shape_type } = data;
  const { schemas, setCurrentSchema } = useSchemaStore();
  const isDark = useThemeStore((s) => s.theme === 'dark');
  const [hovered, setHovered] = useState(false);

  const type = shape_type || 'rectangle';
  const min = MIN_SIZES[type] || MIN_SIZES.rectangle;
  const fallback = DEFAULT_SIZES[type] || DEFAULT_SIZES.rectangle;

  const { w, h } = useStore(
    (s) => {
      const n = s.nodeInternals.get(id);
      return { w: n?.width ?? fallback.w, h: n?.height ?? fallback.h };
    },
    (a, b) => a.w === b.w && a.h === b.h
  );

  const storedW = data.width ?? fallback.w;
  const storedH = data.height ?? fallback.h;
  const content = shapeContent(data, schemas);
  // Combinazioni già verificate: evita di ritentare all'infinito se il salvataggio fallisce e viene annullato.
  const checkedFitsRef = useRef(new Set());

  useEffect(() => {
    if (!onAutoFit) return;
    const key = [type, storedW, storedH, content.title, content.description, content.linkLabel, content.hasImage].join('\u0000');
    if (checkedFitsRef.current.has(key)) return;
    checkedFitsRef.current.add(key);
    const next = fitShapeSize(type, content, { w: storedW, h: storedH });
    if (next) onAutoFit(id, next);
  }, [id, type, storedW, storedH, content.title, content.description, content.linkLabel, content.hasImage, onAutoFit]);

  const box = textBoxFor(type);
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
      <NodeResizer
        isVisible={selected || hovered}
        minWidth={min.w}
        minHeight={min.h}
        keepAspectRatio={LOCKED_RATIO.has(type)}
        lineClassName="shape-resize-line"
        handleClassName="shape-resize-handle"
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
          position: 'absolute',
          left: `${box.x * 100}%`, top: `${box.y * 100}%`,
          width: `${box.w * 100}%`, height: `${box.h * 100}%`,
          padding: `${box.padY}px ${box.padX}px`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
        <div style={CONTENT_STYLE}>
          {image_url && <img src={image_url} alt="" style={IMAGE_STYLE} />}
          {title && <div style={{ ...TITLE_STYLE, color: fg }}>{title}</div>}
          {description && <div style={{ ...DESCRIPTION_STYLE, color: fg }}>{description}</div>}
          {hyperlink && (
            <a
              href={isSchemaLink ? '#' : hyperlink}
              target={isSchemaLink ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={handleLinkClick}
              style={{ ...LINK_STYLE, pointerEvents: 'auto', color: fg, opacity: 0.9 }}
            >
              {content.linkLabel}
            </a>
          )}
          <button
            className="nodrag"
            style={{
              ...EDIT_BUTTON_STYLE,
              pointerEvents: 'auto',
              background: 'rgba(255,255,255,0.25)',
              color: fg,
              cursor: 'pointer',
              backdropFilter: 'blur(2px)',
            }}
            onClick={() => onEdit(id)}
          >
            Modifica
          </button>
        </div>
      </div>
    </div>
  );
}
