import { useEffect, useRef, useState } from 'react';
import { NodeResizer } from 'reactflow';

export const COMMENT_TYPE = 'comment';
export const COMMENT_DEFAULT_COLOR = '#EE2B48';
export const COMMENT_HEADER_H = 34;
export const COMMENT_PADDING = 44;
export const COMMENT_MIN = { w: 160, h: 110 };

export function isComment(shape) {
  return shape?.shape_type === COMMENT_TYPE;
}

function rgba(hex, alpha) {
  const value = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!value) return `rgba(238, 43, 72, ${alpha})`;
  const int = parseInt(value[1], 16);
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
}

export default function CommentNode({ id, data, selected }) {
  const { title, color, text_color, onRename } = data;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title ?? '');
  const inputRef = useRef(null);

  useEffect(() => { setDraft(title ?? ''); }, [title]);
  useEffect(() => { if (editing) inputRef.current?.select(); }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== title) onRename?.(id, next);
    else setDraft(title ?? '');
  };

  const accent = color || COMMENT_DEFAULT_COLOR;

  return (
    <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
      <NodeResizer
        isVisible={selected}
        minWidth={COMMENT_MIN.w}
        minHeight={COMMENT_MIN.h}
        lineClassName="comment-resize-line"
        handleClassName="comment-resize-handle"
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 10,
          border: `2px solid ${rgba(accent, selected ? 0.95 : 0.65)}`,
          background: rgba(accent, 0.1),
          pointerEvents: 'none',
        }}
      />

      <div
        className="comment-drag-handle"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: COMMENT_HEADER_H,
          display: 'flex',
          alignItems: 'center',
          padding: '0 10px',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          background: rgba(accent, selected ? 0.92 : 0.78),
          color: text_color || '#FFFFFF',
          cursor: 'grab',
          pointerEvents: 'auto',
          userSelect: 'none',
        }}
        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title="Trascina per spostare il riquadro e le forme contenute — doppio clic per rinominare"
      >
        {editing ? (
          <input
            ref={inputRef}
            className="nodrag nowheel"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(title ?? ''); setEditing(false); }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.22)',
              border: 'none',
              outline: 'none',
              borderRadius: 4,
              padding: '2px 6px',
              color: 'inherit',
              font: 'inherit',
              fontWeight: 700,
            }}
          />
        ) : (
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 0.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title || 'Commento'}
          </span>
        )}
      </div>
    </div>
  );
}
