import { renderSchema, svgDocument, rasterize } from './renderSvg';
import { readingOrder, normalizeUrl } from './schemaData';
import { linkTarget } from '../components/canvas/shapeLayout';

const INK = '#2A2F3E';
const MUTED = '#5A6176';
const SUBTLE = '#8C93A6';
const LINK = '#1F5FD1';

async function createDoc(orientation = 'portrait') {
  const { jsPDF } = await import('jspdf');
  return new jsPDF({ unit: 'pt', format: 'a4', orientation });
}

// I font standard dei PDF coprono solo il set WinAnsi: i caratteri tipografici più comuni
// vengono convertiti, il resto sostituito, per evitare glifi illeggibili.
const REPLACEMENTS = [
  [/[‘’‚′]/g, "'"], [/[“”„″]/g, '"'],
  [/[–—−]/g, '-'], [/…/g, '...'], [/[•●]/g, '-'],
  [/€/g, 'EUR'], [/ /g, ' '], [/\t/g, '    '],
];
function pdfText(text) {
  let out = String(text ?? '');
  for (const [pattern, value] of REPLACEMENTS) out = out.replace(pattern, value);
  return out.normalize('NFC').replace(/[^\n\x20-\x7E\xA0-\xFF]/g, '?');
}

// --- PDF visuale -------------------------------------------------------------

export async function buildVisualPdf(sections, schemas, images, title) {
  const rendered = sections.map((section, i) => renderSchema(section, schemas, images, `p${i}`));
  const pageOf = new Map(sections.map((s, i) => [String(s.schema.id), i + 1]));
  const margin = 32;
  const header = 34;

  let doc = null;
  for (let i = 0; i < sections.length; i++) {
    const r = rendered[i];
    const orientation = r.width >= r.height ? 'landscape' : 'portrait';
    if (!doc) doc = await createDoc(orientation);
    else doc.addPage('a4', orientation);

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(INK);
    doc.text(pdfText(sections[i].schema.name), margin, margin + 12);
    if (title) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(SUBTLE);
      doc.text(pdfText(title), pageW - margin, margin + 12, { align: 'right' });
    }

    const availW = pageW - margin * 2;
    const availH = pageH - margin * 2 - header;
    const k = Math.min(availW / r.width, availH / r.height, 2);
    const ox = margin + (availW - r.width * k) / 2;
    const oy = margin + header;

    const canvas = await rasterize(svgDocument(r.body, r.width, r.height), r.width, r.height, Math.max(2, k * 2));
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', ox, oy, r.width * k, r.height * k, undefined, 'FAST');

    for (const link of r.links) {
      const box = [ox + link.x * k, oy + link.y * k, link.w * k, link.h * k];
      if (link.target.url) {
        doc.link(...box, { url: normalizeUrl(link.target.url) });
      } else if (pageOf.has(link.target.schemaId)) {
        doc.link(...box, { pageNumber: pageOf.get(link.target.schemaId) });
      }
    }
  }
  return doc.output('blob');
}

// --- PDF testuale ------------------------------------------------------------

export async function buildTextPdf(sections, schemas, { projectName, withIndex }) {
  const doc = await createDoc();
  const margin = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const width = pageW - margin * 2;
  const bulletIndent = 16;

  const destinations = new Map();
  const pendingLinks = [];
  let y = margin;

  const page = () => doc.getCurrentPageInfo().pageNumber;
  const ensure = (height) => {
    if (y + height > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };
  const font = (style, size, color) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(color);
  };

  // Scrive un paragrafo andando a capo e cambiando pagina se serve; restituisce i riquadri delle righe.
  const paragraph = (text, { x = margin, maxWidth = width, size, lineHeight, style = 'normal', color = INK, underline = false }) => {
    font(style, size, color);
    const boxes = [];
    for (const line of doc.splitTextToSize(pdfText(text), maxWidth)) {
      ensure(lineHeight);
      const baseline = y + size;
      doc.text(line, x, baseline);
      const lineW = doc.getTextWidth(line);
      if (underline && lineW) {
        doc.setDrawColor(color);
        doc.setLineWidth(0.6);
        doc.line(x, baseline + 1.5, x + lineW, baseline + 1.5);
      }
      boxes.push({ page: page(), x, y, w: lineW, h: lineHeight });
      y += lineHeight;
    }
    return boxes;
  };

  const linkBoxes = (boxes, target) => {
    for (const box of boxes) pendingLinks.push({ ...box, target });
  };

  if (withIndex) {
    paragraph(projectName || 'Progetto', { size: 26, lineHeight: 32, style: 'bold' });
    paragraph(`Esportato il ${new Date().toLocaleDateString('it-IT')}`, { size: 10, lineHeight: 16, color: SUBTLE });
    y += 18;
    paragraph('Indice', { size: 14, lineHeight: 20, style: 'bold' });
    y += 4;
    sections.forEach((section, i) => {
      const boxes = paragraph(`${i + 1}. ${section.schema.name}`, { size: 11.5, lineHeight: 18, color: LINK, underline: true });
      linkBoxes(boxes, { schemaId: String(section.schema.id) });
    });
  }

  sections.forEach((section, index) => {
    if (withIndex || index > 0) {
      doc.addPage();
      y = margin;
    }
    destinations.set(String(section.schema.id), { pageNumber: page(), top: Math.max(0, y - 8) });

    if (!withIndex && index > 0) {
      paragraph('Schema collegato', { size: 9, lineHeight: 14, color: SUBTLE, style: 'bold' });
    }
    paragraph(section.schema.name, { size: 20, lineHeight: 25, style: 'bold' });
    doc.setDrawColor('#DEE0E7');
    doc.setLineWidth(0.8);
    doc.line(margin, y + 4, pageW - margin, y + 4);
    y += 18;

    const shapes = readingOrder(section.shapes)
      .filter(s => s.title || s.description || s.hyperlink);

    if (!shapes.length) {
      paragraph('Nessuna forma con contenuto in questo schema.', { size: 11, lineHeight: 16, style: 'italic', color: SUBTLE });
      return;
    }

    const textX = margin + bulletIndent;
    const textW = width - bulletIndent;

    for (const shape of shapes) {
      ensure(32);
      font('bold', 12, INK);
      doc.setFillColor(INK);
      doc.circle(margin + 5, y + 8, 2, 'F');

      paragraph(shape.title || 'Senza titolo', {
        x: textX, maxWidth: textW, size: 12, lineHeight: 16,
        style: shape.title ? 'bold' : 'bolditalic', color: shape.title ? INK : SUBTLE,
      });

      if (shape.description) {
        y += 2;
        paragraph(shape.description, { x: textX, maxWidth: textW, size: 10.5, lineHeight: 14.5, color: MUTED });
      }

      const target = linkTarget(shape.hyperlink);
      if (target?.url) {
        y += 3;
        const url = normalizeUrl(target.url);
        linkBoxes(paragraph(`Link: ${url}`, { x: textX, maxWidth: textW, size: 10.5, lineHeight: 14.5, color: LINK, underline: true }), { url });
      } else if (target?.schemaId) {
        y += 3;
        const linked = schemas.find(s => String(s.id) === target.schemaId);
        if (linked) {
          const boxes = paragraph(`Vai allo schema: ${linked.name}`, {
            x: textX, maxWidth: textW, size: 10.5, lineHeight: 14.5, color: LINK, underline: true,
          });
          linkBoxes(boxes, { schemaId: target.schemaId });
        } else {
          paragraph('Schema collegato non più disponibile', { x: textX, maxWidth: textW, size: 10.5, lineHeight: 14.5, style: 'italic', color: SUBTLE });
        }
      }
      y += 12;
    }
  });

  // I link interni puntano anche a schemi che seguono: si aggiungono quando tutte le destinazioni sono note.
  for (const { page: pageNumber, x, y: top, w, h, target } of pendingLinks) {
    doc.setPage(pageNumber);
    if (target.url) {
      doc.link(x, top, w, h, { url: target.url });
    } else if (destinations.has(target.schemaId)) {
      doc.link(x, top, w, h, destinations.get(target.schemaId));
    }
  }

  return doc.output('blob');
}
