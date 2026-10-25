export const DEFAULT_SIZES = {
  rectangle: { w: 180, h: 90 },
  square:    { w: 110, h: 110 },
  circle:    { w: 110, h: 110 },
  diamond:   { w: 140, h: 140 },
  triangle:  { w: 140, h: 120 },
};

export const MIN_SIZES = {
  rectangle: { w: 90,  h: 52 },
  square:    { w: 60,  h: 60 },
  circle:    { w: 60,  h: 60 },
  diamond:   { w: 80,  h: 80 },
  triangle:  { w: 80,  h: 70 },
};

export const LOCKED_RATIO = new Set(['circle', 'square']);

// Area riservata al testo, in frazioni del riquadro della forma, più il padding in px.
// Per cerchio, rombo e triangolo è il rettangolo inscritto nella figura.
export const TEXT_BOX = {
  rectangle: { x: 0,    y: 0,    w: 1,   h: 1,    padX: 12, padY: 8 },
  square:    { x: 0,    y: 0,    w: 1,   h: 1,    padX: 10, padY: 10 },
  circle:    { x: 0.15, y: 0.15, w: 0.7, h: 0.7,  padX: 2,  padY: 2 },
  diamond:   { x: 0.25, y: 0.25, w: 0.5, h: 0.5,  padX: 2,  padY: 2 },
  triangle:  { x: 0.25, y: 0.52, w: 0.5, h: 0.44, padX: 2,  padY: 2 },
};

// Altezza massima rispetto alla larghezza prima di preferire l'allargamento.
const MAX_RATIO = { rectangle: 0.75, diamond: 1, triangle: 1 };
const MAX_AUTO_WIDTH = 640;
const MAX_LOCKED_SIZE = 4000;

const wrapText = { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', maxWidth: '100%', flexShrink: 0 };

export const CONTENT_STYLE = { display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' };
export const IMAGE_STYLE = { width: '100%', height: 28, objectFit: 'cover', borderRadius: 3, marginBottom: 3, flexShrink: 0 };
export const TITLE_STYLE = { ...wrapText, fontWeight: 700, fontSize: 12, lineHeight: 1.25, textAlign: 'center' };
export const DESCRIPTION_STYLE = { ...wrapText, fontSize: 10, lineHeight: 1.35, marginTop: 2, opacity: 0.85, textAlign: 'center' };
export const LINK_STYLE = { ...wrapText, fontSize: 10, lineHeight: 1.25, marginTop: 2, textAlign: 'center', textDecoration: 'underline' };
export const EDIT_BUTTON_STYLE = {
  flexShrink: 0, marginTop: 4, fontSize: 10, lineHeight: 1.2, padding: '2px 8px',
  borderRadius: 5, border: '1px solid rgba(255,255,255,0.35)',
};

export function textBoxFor(type) {
  return TEXT_BOX[type] || TEXT_BOX.rectangle;
}

export function linkTarget(hyperlink) {
  if (!hyperlink) return null;
  if (hyperlink.startsWith('schema:')) return { schemaId: hyperlink.slice('schema:'.length) };
  return { url: hyperlink };
}

// Testo effettivamente visibile nella forma: serve sia al rendering sia alla misurazione.
export function shapeContent(shape, schemas = []) {
  const target = linkTarget(shape.hyperlink);
  let linkLabel = '';
  if (target?.schemaId) {
    linkLabel = schemas.find(s => String(s.id) === target.schemaId)?.name || 'Schema';
  } else if (target?.url) {
    linkLabel = 'Link';
  }
  return {
    title: shape.title || '',
    description: shape.description || '',
    linkLabel,
    hasImage: !!shape.image_url,
  };
}

const PX_KEYS = new Set(['fontSize', 'height', 'marginTop', 'marginBottom', 'borderRadius']);

function applyStyle(el, style) {
  for (const [key, value] of Object.entries(style)) {
    el.style[key] = typeof value === 'number' && PX_KEYS.has(key) ? `${value}px` : String(value);
  }
  return el;
}

function block(tag, style, text) {
  const el = applyStyle(document.createElement(tag), style);
  if (text) el.textContent = text;
  return el;
}

let probe = null;

function measureContentHeight(content, width) {
  if (!probe) {
    probe = applyStyle(document.createElement('div'), CONTENT_STYLE);
    Object.assign(probe.style, {
      position: 'absolute', left: '-10000px', top: '0', visibility: 'hidden', pointerEvents: 'none',
    });
    document.body.appendChild(probe);
  }
  probe.style.width = `${Math.max(1, width)}px`;

  const children = [];
  if (content.hasImage) children.push(block('div', IMAGE_STYLE));
  if (content.title) children.push(block('div', TITLE_STYLE, content.title));
  if (content.description) children.push(block('div', DESCRIPTION_STYLE, content.description));
  if (content.linkLabel) children.push(block('div', LINK_STYLE, content.linkLabel));
  children.push(block('button', EDIT_BUTTON_STYLE, 'Modifica'));
  probe.replaceChildren(...children);

  return probe.getBoundingClientRect().height;
}

// Restituisce la dimensione minima (mai più piccola di quella attuale) che contiene
// tutto il testo, oppure null se il testo entra già.
export function fitShapeSize(type, content, size) {
  const kind = TEXT_BOX[type] ? type : 'rectangle';
  const box = TEXT_BOX[kind];
  const min = MIN_SIZES[kind];
  const w = Math.max(Math.round(size.w || 0), min.w);
  const h = Math.max(Math.round(size.h || 0), min.h);

  const requiredHeight = (width) =>
    (measureContentHeight(content, width * box.w - box.padX * 2) + box.padY * 2) / box.h;

  if (requiredHeight(w) <= h + 0.5) return null;

  if (LOCKED_RATIO.has(kind)) {
    let side = Math.max(w, h);
    while (requiredHeight(side) > side && side < MAX_LOCKED_SIZE) side = Math.ceil(side * 1.06);
    return { w: side, h: side };
  }

  const ratio = MAX_RATIO[kind];
  for (let width = w; ; width = Math.min(MAX_AUTO_WIDTH, Math.ceil(width * 1.06))) {
    const height = Math.max(h, requiredHeight(width));
    if (height <= Math.max(h, width * ratio) || width >= MAX_AUTO_WIDTH) {
      return { w: width, h: Math.ceil(height) };
    }
  }
}
