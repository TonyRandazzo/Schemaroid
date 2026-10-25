import { DEFAULT_SIZES, linkTarget } from '../components/canvas/shapeLayout';
import { DEFAULT_SHAPE_COLOR, DEFAULT_TEXT_COLOR } from '../components/canvas/ShapeNode';
import { COMMENT_DEFAULT_COLOR, COMMENT_HEADER_H, isComment } from '../components/canvas/CommentNode';
import { escapeXml } from './renderSvg';
import { normalizeUrl } from './schemaData';

const EDGE_COLOR = '#8C93A6';

const SHAPE_STYLE = {
  rectangle: 'rounded=1;arcSize=10;absoluteArcSize=1;',
  square: 'rounded=1;arcSize=4;absoluteArcSize=1;',
  circle: 'ellipse;',
  diamond: 'rhombus;',
  triangle: 'triangle;direction=north;verticalAlign=bottom;spacingBottom=8;',
};

const EXIT_POINT = {
  top: [0.5, 0],
  right: [1, 0.5],
  bottom: [0.5, 1],
  left: [0, 0.5],
};

const pageId = (schemaId) => `schema-${schemaId}`;
const cellId = (shapeId) => `n-${shapeId}`;

function escapeHtml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function mixWithWhite(hex, amount) {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!match) return '#FDEAED';
  const int = parseInt(match[1], 16);
  const channel = (shift) => Math.round(((int >> shift) & 255) * amount + 255 * (1 - amount));
  return `#${[16, 8, 0].map(s => channel(s).toString(16).padStart(2, '0')).join('')}`;
}

function rectOf(shape) {
  if (isComment(shape)) {
    return { x: shape.x ?? 100, y: shape.y ?? 100, w: shape.width ?? 360, h: shape.height ?? 220 };
  }
  const fallback = DEFAULT_SIZES[shape.shape_type] || DEFAULT_SIZES.rectangle;
  return { x: shape.x ?? 100, y: shape.y ?? 100, w: shape.width ?? fallback.w, h: shape.height ?? fallback.h };
}

const inside = (outer, inner) => inner.x >= outer.x && inner.y >= outer.y
  && inner.x + inner.w <= outer.x + outer.w && inner.y + inner.h <= outer.y + outer.h;

function shapeLabel(shape, schemas) {
  const parts = [];
  if (shape.image_url) {
    parts.push(`<img src="${escapeHtml(shape.image_url)}" style="width:100%;height:28px;object-fit:cover;border-radius:3px">`);
  }
  if (shape.title) parts.push(`<b>${escapeHtml(shape.title)}</b>`);
  if (shape.description) {
    parts.push(`<span style="font-size:10px">${escapeHtml(shape.description).replace(/\n/g, '<br>')}</span>`);
  }
  const target = linkTarget(shape.hyperlink);
  if (target) {
    const label = target.schemaId
      ? (schemas.find(s => String(s.id) === target.schemaId)?.name || 'Schema')
      : 'Link';
    parts.push(`<u style="font-size:10px">${escapeHtml(label)}</u>`);
  }
  return parts.join('<br>');
}

function linkAttr(shape, pageIds) {
  const target = linkTarget(shape.hyperlink);
  if (!target) return null;
  if (target.url) return normalizeUrl(target.url);
  return pageIds.has(target.schemaId) ? `data:page/id,${pageId(target.schemaId)}` : null;
}

function vertex({ id, value, style, parent, rect, link }) {
  const geometry = `<mxGeometry x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" as="geometry"/>`;
  if (link) {
    return `<UserObject label="${escapeXml(value)}" link="${escapeXml(link)}" id="${id}">`
      + `<mxCell style="${escapeXml(style)}" vertex="1" parent="${parent}">${geometry}</mxCell></UserObject>`;
  }
  return `<mxCell id="${id}" value="${escapeXml(value)}" style="${escapeXml(style)}" vertex="1" parent="${parent}">${geometry}</mxCell>`;
}

function diagram(section, schemas, pageIds) {
  const rects = new Map(section.shapes.map(s => [String(s.id), rectOf(s)]));

  // I riquadri commento diventano contenitori: spostandoli in diagrams.net si portano dietro le forme interne.
  const comments = section.shapes.filter(isComment)
    .sort((a, b) => {
      const ra = rects.get(String(a.id));
      const rb = rects.get(String(b.id));
      return rb.w * rb.h - ra.w * ra.h;
    });
  const parentOf = (shape) => {
    const rect = rects.get(String(shape.id));
    let best = null;
    for (const c of comments) {
      if (c.id === shape.id) continue;
      const cr = rects.get(String(c.id));
      if (cr.w * cr.h <= rect.w * rect.h || !inside(cr, rect)) continue;
      if (!best || cr.w * cr.h < rects.get(String(best.id)).w * rects.get(String(best.id)).h) best = c;
    }
    return best;
  };
  const relative = (shape) => {
    const rect = rects.get(String(shape.id));
    const parent = parentOf(shape);
    if (!parent) return { parent: '1', rect };
    const pr = rects.get(String(parent.id));
    return { parent: cellId(parent.id), rect: { ...rect, x: rect.x - pr.x, y: rect.y - pr.y } };
  };

  const cells = ['<mxCell id="0"/>', '<mxCell id="1" parent="0"/>'];

  for (const c of comments) {
    const color = c.color || COMMENT_DEFAULT_COLOR;
    const style = `swimlane;startSize=${COMMENT_HEADER_H};rounded=1;arcSize=8;html=1;whiteSpace=wrap;swimlaneLine=0;`
      + `fillColor=${color};swimlaneFillColor=${mixWithWhite(color, 0.1)};strokeColor=${color};strokeWidth=2;`
      + `fontColor=${c.text_color || '#FFFFFF'};fontStyle=1;fontSize=13;align=left;spacingLeft=10;collapsible=0;`;
    cells.push(vertex({ id: cellId(c.id), value: escapeHtml(c.title || 'Commento'), style, ...relative(c) }));
  }

  for (const s of section.shapes.filter(sh => !isComment(sh))) {
    const type = SHAPE_STYLE[s.shape_type] ? s.shape_type : 'rectangle';
    const target = linkTarget(s.hyperlink);
    const stroke = !target ? '#2A2F3E' : target.schemaId ? '#F0A500' : '#EE2B48';
    const style = `${SHAPE_STYLE[type]}whiteSpace=wrap;html=1;fillColor=${s.color || DEFAULT_SHAPE_COLOR};`
      + `fontColor=${s.text_color || DEFAULT_TEXT_COLOR};strokeColor=${stroke};strokeWidth=2.5;fontSize=12;`;
    cells.push(vertex({
      id: cellId(s.id), value: shapeLabel(s, schemas), style, link: linkAttr(s, pageIds), ...relative(s),
    }));
  }

  for (const c of section.connections) {
    if (!rects.has(String(c.source_shape_id)) || !rects.has(String(c.target_shape_id))) continue;
    const [exitX, exitY] = EXIT_POINT[c.source_handle] ?? EXIT_POINT.top;
    const [entryX, entryY] = EXIT_POINT[c.target_handle] ?? EXIT_POINT.top;
    const style = `edgeStyle=orthogonalEdgeStyle;curved=1;html=1;endArrow=none;strokeColor=${EDGE_COLOR};strokeWidth=2;`
      + `exitX=${exitX};exitY=${exitY};exitDx=0;exitDy=0;entryX=${entryX};entryY=${entryY};entryDx=0;entryDy=0;`;
    cells.push(
      `<mxCell id="e-${c.id}" value="${escapeXml(c.label ? escapeHtml(c.label) : '')}" style="${escapeXml(style)}" `
      + `edge="1" parent="1" source="${cellId(c.source_shape_id)}" target="${cellId(c.target_shape_id)}">`
      + '<mxGeometry relative="1" as="geometry"/></mxCell>'
    );
  }

  return `<diagram id="${pageId(section.schema.id)}" name="${escapeXml(section.schema.name)}">`
    + '<mxGraphModel grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" math="0" shadow="0">'
    + `<root>${cells.join('')}</root></mxGraphModel></diagram>`;
}

// Un file .drawio con una pagina per schema; i link tra schemi diventano link tra pagine.
export function buildDrawio(sections, schemas) {
  const pageIds = new Set(sections.map(s => String(s.schema.id)));
  const pages = sections.map(section => diagram(section, schemas, pageIds)).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<mxfile host="Schemaroid" type="device">${pages}</mxfile>`;
}
