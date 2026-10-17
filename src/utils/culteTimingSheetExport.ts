import type { FicheBranding, TimingSheetModel } from '../lib/timingSheet';
import { buildTimingSheetPdf, type PdfImage } from './culteTimingSheetPdf';

// Production du PDF de la fiche de timing dans le navigateur : chargement des logos, puis téléchargement
// ou ouverture dans un onglet (pour imprimer). Ce module est chargé à la demande (import dynamique) :
// jsPDF n'alourdit pas le reste de l'application.

const MAX_SIDE = 700; // un logo de 2 cm n'a pas besoin de plus : le PDF reste léger (il se partage par WhatsApp)

const cache = new Map<string, PdfImage>();

/** Charge une image du site et la convertit en PNG (URL de données). Renvoie null si elle est introuvable. */
async function loadImage(url: string): Promise<PdfImage | null> {
  const known = cache.get(url);
  if (known) return known;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const objectUrl = URL.createObjectURL(await response.blob());
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error(`Image illisible : ${url}`));
        element.src = objectUrl;
      });
      const scale = Math.min(1, MAX_SIDE / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      const loaded: PdfImage = { dataUrl: canvas.toDataURL('image/png'), format: 'PNG', width: canvas.width, height: canvas.height };
      cache.set(url, loaded);
      return loaded;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (error) {
    // Logo d'une autre origine sans autorisation, réseau coupé… : la fiche se fait sans cette image
    console.warn('Image de la fiche non chargée :', error);
    return null;
  }
}

export type ExportMode = 'download' | 'open';

/**
 * Produit la fiche et la télécharge, ou l'ouvre dans la fenêtre `win` (ouverte par le clic, avant tout chargement,
 * sinon le navigateur la bloque). Si la fenêtre n'est pas utilisable, le PDF est téléchargé.
 */
export async function exportTimingSheet(
  model: TimingSheetModel,
  branding: FicheBranding,
  mode: ExportMode,
  win?: Window | null
): Promise<'opened' | 'downloaded'> {
  const [logo, flame] = await Promise.all([loadImage(branding.logoUrl), branding.flameUrl ? loadImage(branding.flameUrl) : Promise.resolve(null)]);
  const doc = buildTimingSheetPdf(model, { logo, flame });
  if (mode === 'open' && win && !win.closed) {
    const url = URL.createObjectURL(doc.output('blob'));
    win.location.href = url;
    window.setTimeout(() => URL.revokeObjectURL(url), 10 * 60_000);
    return 'opened';
  }
  doc.save(model.fileName);
  return 'downloaded';
}
