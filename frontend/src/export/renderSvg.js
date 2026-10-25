import { getBezierPath, Position } from 'reactflow';
import {
  DEFAULT_SIZES, IMAGE_STYLE, TITLE_STYLE, DESCRIPTION_STYLE, LINK_STYLE,
  textBoxFor, shapeContent, linkTarget,
} from '../components/canvas/shapeLayout';
import { DEFAULT_SHAPE_COLOR, DEFAULT_TEXT_COLOR } from '../components/canvas/ShapeNode';
import { COMMENT_DEFAULT_COLOR, COMMENT_HEADER_H, isComment } from '../components/canvas/CommentNode';

const PADDING = 40;
const EDGE_COLOR = '#8C93A6';
const INK = '#2A2F3E';
const STROKE = 2.5;
const HEADING_H = 56;

const POSITIONS = { top: Position.Top, right: Position.Right, bottom: Position.Bottom, left: Position.Left };

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

const fontFamily = () => getComputedStyle(document.body).fontFamily || 'sans-serif';

let measureCtx = null;
function measure(text, style) {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  measureCtx.font = `${style.fontWeight ?? 400} ${style.fontSize}px ${fontFamily()}`;
  return measureCtx.measureText(text).width;
}

function wrapLines(text, style, maxWidth) {
  const lines = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(' ')) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate, style) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const ch of word) {
        if (line && measure(line + ch, style) > maxWidth) {
          lines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

function shapeRect(shape) {
  if (isComment(shape)) {
    return { x: shape.x ?? 100, y: shape.y ?? 100, w: shape.width ?? 360, h: shape.height ?? 220 };
  }
  const fallback = DEFAULT_SIZES[shape.shape_type] || DEFAULT_SIZES.rectangle;
  return { x: shape.x ?? 100, y: shape.y ?? 100, w: shape.width ?? fallback.w, h: shape.height ?? fallback.h };
}

function borderColor(hyperlink) {
  if (!hyperlink) return INK;
  return hyperlink.startsWith('schema:') ? '#F0A500' : '#EE2B48';
}

function outline(type, { x, y, w, h }, fill, stroke) {
  const hs = STROKE / 2;
  const paint = `fill="${escapeXml(fill)}" stroke="${stroke}" stroke-width="${STROKE}" stroke-linejoin="round"`;
  if (type === 'circle') {
    return `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2 - hs}" ry="${h / 2 - hs}" ${paint}/>`;
  }
  if (type === 'diamond') {
    return `<polygon points="${x + w / 2},${y + hs} ${x + w - hs},${y + h / 2} ${x + w / 2},${y + h - hs} ${x + hs},${y + h / 2}" ${paint}/>`;
  }
  if (type === 'triangle') {
    return `<polygon points="${x + w / 2},${y + hs} ${x + w - hs},${y + h - hs} ${x + hs},${y + h - hs}" ${paint}/>`;
  }
  const rx = type === 'square' ? 4 : 10;
  return `<rect x="${x + hs}" y="${y + hs}" width="${w - STROKE}" height="${h - STROKE}" rx="${rx}" ${paint}/>`;
}

function textBlock(lines, style, { cx, top, color, opacity = 1, underline = false }) {
  const lineH = style.fontSize * style.lineHeight;
  const decoration = underline ? ' text-decoration="underline"' : '';
  const tspans = lines.map((line, i) => (
    `<tspan x="${cx}" y="${top + lineH * i + lineH / 2}">${escapeXml(line) || ' '}</tspan>`
  )).join('');
  return `<text text-anchor="middle" dominant-baseline="central" font-size="${style.fontSize}" `
    + `font-weight="${style.fontWeight ?? 400}" fill="${escapeXml(color)}" fill-opacity="${opacity}"${decoration}>${tspans}</text>`;
}

function shapeSvg(shape, rect, schemas, images, clipId) {
  const type = shape.shape_type || 'rectangle';
  const fg = shape.text_color || DEFAULT_TEXT_COLOR;
  const content = shapeContent(shape, schemas);
  const box = textBoxFor(type);
  const inner = {
    x: rect.x + rect.w * box.x + box.padX,
    y: rect.y + rect.h * box.y + box.padY,
    w: rect.w * box.w - box.padX * 2,
    h: rect.h * box.h - box.padY * 2,
  };

  const parts = [];
  const image = content.hasImage ? images.get(shape.image_url) : null;
  if (image) parts.push({ kind: 'image', height: IMAGE_STYLE.height + IMAGE_STYLE.marginBottom });
  for (const [text, style, opts] of [
    [content.title, TITLE_STYLE, {}],
    [content.description, DESCRIPTION_STYLE, { opacity: 0.85 }],
    [content.linkLabel, LINK_STYLE, { opacity: 0.9, underline: true }],
  ]) {
    if (!text) continue;
    const lines = wrapLines(text, style, inner.w);
    const marginTop = parts.length ? (style.marginTop ?? 0) : 0;
    parts.push({ kind: 'text', lines, style, opts, marginTop, height: marginTop + lines.length * style.fontSize * style.lineHeight });
  }

  const total = parts.reduce((sum, p) => sum + p.height, 0);
  let top = inner.y + (inner.h - total) / 2;
  const cx = inner.x + inner.w / 2;

  let svg = outline(type, rect, shape.color || DEFAULT_SHAPE_COLOR, borderColor(shape.hyperlink));
  for (const part of parts) {
    if (part.kind === 'image') {
      svg += `<clipPath id="${clipId}"><rect x="${inner.x}" y="${top}" width="${inner.w}" height="${IMAGE_STYLE.height}" rx="${IMAGE_STYLE.borderRadius}"/></clipPath>`
        + `<image href="${escapeXml(image)}" x="${inner.x}" y="${top}" width="${inner.w}" height="${IMAGE_STYLE.height}" `
        + `preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`;
    } else {
      svg += textBlock(part.lines, part.style, { cx, top: top + part.marginTop, color: fg, ...part.opts });
    }
    top += part.height;
  }
  return svg;
}

function commentSvg(shape, rect) {
  const color = shape.color || COMMENT_DEFAULT_COLOR;
  const title = shape.title || 'Commento';
  return `<rect x="${rect.x + 1}" y="${rect.y + 1}" width="${rect.w - 2}" height="${rect.h - 2}" rx="10" `
    + `fill="${escapeXml(color)}" fill-opacity="0.1" stroke="${escapeXml(color)}" stroke-opacity="0.65" stroke-width="2"/>`
    + `<path d="M${rect.x + 1},${rect.y + COMMENT_HEADER_H} V${rect.y + 9} a8,8 0 0 1 8,-8 H${rect.x + rect.w - 9} `
    + `a8,8 0 0 1 8,8 V${rect.y + COMMENT_HEADER_H} Z" fill="${escapeXml(color)}" fill-opacity="0.78"/>`
    + `<text x="${rect.x + 10}" y="${rect.y + COMMENT_HEADER_H / 2}" dominant-baseline="central" font-size="13" `
    + `font-weight="700" fill="${escapeXml(shape.text_color || '#FFFFFF')}">${escapeXml(title)}</text>`;
}

function handlePoint(rect, handle) {
  switch (handle) {
    case 'right': return { x: rect.x + rect.w, y: rect.y + rect.h / 2 };
    case 'bottom': return { x: rect.x + rect.w / 2, y: rect.y + rect.h };
    case 'left': return { x: rect.x, y: rect.y + rect.h / 2 };
    default: return { x: rect.x + rect.w / 2, y: rect.y };
  }
}

function edgeSvg(connection, rects) {
  const source = rects.get(String(connection.source_shape_id));
  const target = rects.get(String(connection.target_shape_id));
  if (!source || !target) return '';

  // Senza handle salvato React Flow usa il primo pin del nodo, cioè quello in alto.
  const sourceHandle = connection.source_handle || 'top';
  const targetHandle = connection.target_handle || 'top';
  const s = handlePoint(source, sourceHandle);
  const t = handlePoint(target, targetHandle);
  const [path, labelX, labelY] = getBezierPath({
    sourceX: s.x, sourceY: s.y, sourcePosition: POSITIONS[sourceHandle],
    targetX: t.x, targetY: t.y, targetPosition: POSITIONS[targetHandle],
  });

  let svg = `<path d="${path}" fill="none" stroke="${EDGE_COLOR}" stroke-width="2"/>`;
  if (connection.label) {
    const style = { fontSize: 10 };
    const w = measure(connection.label, style) + 8;
    svg += `<rect x="${labelX - w / 2}" y="${labelY - 8}" width="${w}" height="16" rx="2" fill="#FFFFFF"/>`
      + `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="central" font-size="10" fill="#5A6176">`
      + `${escapeXml(connection.label)}</text>`;
  }
  return svg;
}

async function toDataUrl(url) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Le immagini vanno incorporate: un SVG disegnato su canvas non carica risorse esterne.
export async function loadImages(sections) {
  const urls = new Set(sections.flatMap(s => s.shapes.map(sh => sh.image_url).filter(Boolean)));
  const images = new Map();
  await Promise.all([...urls].map(async (url) => {
    try {
      images.set(url, await toDataUrl(url));
    } catch {
      // Immagine non raggiungibile (CORS o rete): la forma viene esportata senza.
    }
  }));
  return images;
}

// Disegna uno schema in coordinate locali (origine in alto a sinistra con margine).
// `links` riporta le aree cliccabili delle forme con collegamento, per il PDF.
export function renderSchema(section, schemas, images, idPrefix = 's') {
  const rects = new Map(section.shapes.map(s => [String(s.id), shapeRect(s)]));

  if (!section.shapes.length) {
    return {
      width: 480, height: 160, links: [],
      body: `<text x="240" y="80" text-anchor="middle" dominant-baseline="central" font-size="14" fill="#8C93A6">Schema vuoto</text>`,
    };
  }

  const all = [...rects.values()];
  const minX = Math.min(...all.map(r => r.x));
  const minY = Math.min(...all.map(r => r.y));
  const maxX = Math.max(...all.map(r => r.x + r.w));
  const maxY = Math.max(...all.map(r => r.y + r.h));
  const dx = PADDING - minX;
  const dy = PADDING - minY;
  for (const [id, r] of rects) rects.set(id, { ...r, x: r.x + dx, y: r.y + dy });

  const comments = section.shapes
    .filter(isComment)
    .sort((a, b) => {
      const ra = rects.get(String(a.id));
      const rb = rects.get(String(b.id));
      return rb.w * rb.h - ra.w * ra.h;
    });
  const shapes = section.shapes.filter(s => !isComment(s));

  let body = comments.map(c => commentSvg(c, rects.get(String(c.id)))).join('');
  body += section.connections.map(c => edgeSvg(c, rects)).join('');
  body += shapes.map((s, i) => shapeSvg(s, rects.get(String(s.id)), schemas, images, `${idPrefix}-clip-${i}`)).join('');

  const links = shapes
    .map(s => ({ ...rects.get(String(s.id)), target: linkTarget(s.hyperlink) }))
    .filter(l => l.target);

  return { width: maxX - minX + PADDING * 2, height: maxY - minY + PADDING * 2, links, body };
}

export function svgDocument(body, width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" `
    + `font-family="${escapeXml(fontFamily())}"><rect width="100%" height="100%" fill="#FFFFFF"/>${body}</svg>`;
}

// Più schemi impilati in verticale, ognuno preceduto dal proprio nome.
export function stackedDocument(rendered) {
  const width = Math.max(...rendered.map(r => r.width));
  let y = 0;
  let body = '';
  for (const { name, width: w, height: h, body: inner } of rendered) {
    body += `<text x="${PADDING}" y="${y + HEADING_H / 2 + 8}" dominant-baseline="central" font-size="22" `
      + `font-weight="700" fill="${INK}">${escapeXml(name)}</text>`
      + `<line x1="${PADDING}" x2="${width - PADDING}" y1="${y + HEADING_H}" y2="${y + HEADING_H}" stroke="#DEE0E7"/>`
      + `<g transform="translate(${(width - w) / 2}, ${y + HEADING_H})">${inner}</g>`;
    y += HEADING_H + h;
  }
  return { svg: svgDocument(body, width, y), width, height: y };
}

export async function rasterize(svg, width, height, scale = 2) {
  const factor = Math.min(scale, 12000 / Math.max(width, height), Math.sqrt(60e6 / (width * height)));
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error('Impossibile generare l\'immagine dello schema'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * factor));
  canvas.height = Math.max(1, Math.round(height * factor));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
