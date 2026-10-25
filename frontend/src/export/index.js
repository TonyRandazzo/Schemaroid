import { loadSections, loadLinkedSections, downloadBlob, fileSlug } from './schemaData';
import { loadImages, renderSchema, svgDocument, stackedDocument, rasterize } from './renderSvg';
import { buildDrawio } from './drawio';
import { buildVisualPdf, buildTextPdf } from './pdf';

const canvasToBlob = (canvas) => new Promise((resolve, reject) => {
  canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Immagine troppo grande da generare'))), 'image/png');
});

async function exportPng(sections, schemas, stacked) {
  const images = await loadImages(sections);
  const rendered = sections.map((section, i) => ({
    name: section.schema.name,
    ...renderSchema(section, schemas, images, `i${i}`),
  }));

  const { svg, width, height } = stacked
    ? stackedDocument(rendered)
    : { svg: svgDocument(rendered[0].body, rendered[0].width, rendered[0].height), ...rendered[0] };
  return canvasToBlob(await rasterize(svg, width, height, 2));
}

/**
 * scope 'schema': lo schema indicato (per PDF e .drawio anche gli schemi che collega,
 * così i collegamenti interni funzionano); scope 'project': tutti gli schemi del progetto.
 */
export async function runExport({ format, scope, project, schemas, schemaId }) {
  const projectName = project?.name || 'Progetto';
  const root = schemas.find(s => String(s.id) === String(schemaId));
  if (scope === 'schema' && !root) throw new Error('Nessuno schema selezionato');
  if (!schemas.length) throw new Error('Il progetto non contiene schemi');

  const isProject = scope === 'project';
  const baseName = isProject ? fileSlug(projectName) : `${fileSlug(projectName)}-${fileSlug(root.name)}`;

  let sections;
  if (isProject) sections = await loadSections(schemas);
  else if (format === 'png') sections = await loadSections([root]);
  else sections = await loadLinkedSections(root.id, schemas);

  switch (format) {
    case 'png':
      downloadBlob(await exportPng(sections, schemas, isProject), `${baseName}.png`);
      break;
    case 'pdf': {
      const images = await loadImages(sections);
      downloadBlob(await buildVisualPdf(sections, schemas, images, projectName), `${baseName}.pdf`);
      break;
    }
    case 'pdf-text':
      downloadBlob(
        await buildTextPdf(sections, schemas, { projectName, withIndex: isProject }),
        `${baseName}-testo.pdf`
      );
      break;
    case 'drawio':
      downloadBlob(
        new Blob([buildDrawio(sections, schemas)], { type: 'application/xml' }),
        `${baseName}.drawio`
      );
      break;
    default:
      throw new Error(`Formato non supportato: ${format}`);
  }
}
