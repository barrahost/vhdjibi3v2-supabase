import { jsPDF } from 'jspdf';
import type { AnnouncementItem, SheetBlock, TimingSheetModel } from '../lib/timingSheet';

// Dessin de la « fiche de timing » (A4 paysage) au format de la fiche papier de l'église :
// en-tête (logo, titre, date), bannière du culte, colonne de gauche (prédicateur, dirigeant, moments et séquences
// minutées), colonne de droite (Sainte Cène, annonces du pasteur, annonces du dirigeant), pied de page (verset, NB).
// Les tailles de texte se réduisent d'elles-mêmes pour que tout tienne sur la page ; au-delà, la suite passe sur
// une page supplémentaire (rien n'est jamais coupé).

type RGB = [number, number, number];

const TEAL: RGB = [0, 108, 104];
const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];
const GRAY: RGB = [115, 115, 115];
const RED: RGB = [255, 0, 0];
const NB_RED: RGB = [175, 31, 41];
const HAIRLINE: RGB = [231, 231, 231];
const BANNER_EDGE: RGB = [116, 170, 168];

// Dégradé des barres (vert sarcelle → violet), relevé sur la fiche d'origine
const BAR_STOPS: [number, RGB][] = [
  [0, [20, 108, 109]],
  [0.23, [75, 119, 149]],
  [0.45, [101, 96, 198]],
  [0.7, [128, 85, 235]],
  [1, [139, 81, 254]],
];

const PAGE_W = 297;
const PAGE_H = 210;
const PT = 0.3528; // 1 pt en mm

const LEFT = { x: 12, right: 141.7, labelX: 15, timeX: 94, durationX: 127.5 };
const RIGHT = { barX: 155.3, barRight: 292.2, textX: 154.8, textRight: 291.5 };
const CONTENT_BOTTOM = 187; // au-dessus du cadre du pied de page
const CONTINUATION_TOP = 28;
// Pied de page : le verset à gauche, la note (NB) à droite, 4 lignes au plus
const VERSE_W = 156;
const NOTE_W = 100;
const FOOTER_MIN_SIZE = 6.5;
const CHAR_SPACE = 0.3; // espacement des lettres de la barre du dirigeant (mm)
const BANNER_RIGHT = 287.3; // bord droit de la bannière du culte

/** Image déjà chargée (URL de données) et ses dimensions en pixels, pour garder les proportions. */
export interface PdfImage {
  dataUrl: string;
  format: 'PNG' | 'JPEG';
  width: number;
  height: number;
}

export interface FicheAssets {
  logo?: PdfImage | null;
  flame?: PdfImage | null;
}

// ── Couleurs et dégradé ──────────────────────────────────────────────────────────────────────────
const mix = (a: RGB, b: RGB, t: number): RGB => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as RGB;

function gradientAt(t: number): RGB {
  for (let i = 1; i < BAR_STOPS.length; i += 1) {
    const [t1, c1] = BAR_STOPS[i];
    if (t <= t1) {
      const [t0, c0] = BAR_STOPS[i - 1];
      return mix(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return BAR_STOPS[BAR_STOPS.length - 1][1];
}

function gradientBar(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const slices = 56;
  const step = w / slices;
  for (let i = 0; i < slices; i += 1) {
    doc.setFillColor(...gradientAt((i + 0.5) / slices));
    doc.rect(x + i * step, y, step + 0.25, h, 'F'); // léger recouvrement : pas de fine ligne entre deux tranches
  }
}

// ── Texte : styles mélangés et retours à la ligne ────────────────────────────────────────────────
interface Run {
  text: string;
  bold?: boolean;
  color?: RGB;
}
interface Piece {
  text: string;
  bold: boolean;
  color: RGB;
  x: number;
}

function style(doc: jsPDF, size: number, bold: boolean) {
  doc.setFont('helvetica', bold ? 'bold' : 'normal');
  doc.setFontSize(size);
}

const lineHeight = (size: number) => size * PT * 1.22;

/** Largeur d'un texte en mm. Avec ses polices standard, jsPDF mesure « œ » et « Œ » trop étroits : on corrige. */
function measure(doc: jsPDF, text: string, size: number): number {
  const oe = (text.match(/œ/g) ?? []).length;
  const OE = (text.match(/Œ/g) ?? []).length;
  return doc.getTextWidth(text) + size * PT * (oe * 0.4 + OE * 0.46);
}

/** Caractères que les polices standard du PDF savent écrire : latin (accents, « », œ), tirets, apostrophes, points de suspension. */
const UNSUPPORTED = /[^\u0020-\u007E\u00A0-\u00FF\u0152\u0153\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC\n]/g;

/** Enlève ce qui ne s'imprimerait pas (émojis, symboles, caractères invisibles) plutôt que d'écrire des signes illisibles. */
export function printable(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\t\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
    .replace(UNSUPPORTED, '');
}

function printableDeep<T>(value: T): T {
  if (typeof value === 'string') return printable(value) as unknown as T;
  if (Array.isArray(value)) return value.map((item) => printableDeep(item)) as unknown as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, printableDeep(item)])) as T;
  }
  return value;
}

/** Découpe un mot plus large que la ligne (adresse web très longue…) : il passe sur plusieurs lignes au lieu de déborder de la page. */
function splitWord(doc: jsPDF, word: string, bold: boolean, size: number, maxW: number): string[] {
  style(doc, size, bold);
  if (measure(doc, word, size) <= maxW) return [word];
  const parts: string[] = [];
  let part = '';
  Array.from(word).forEach((char) => {
    if (part && measure(doc, part + char, size) > maxW) {
      parts.push(part);
      part = '';
    }
    part += char;
  });
  if (part) parts.push(part);
  return parts;
}

/** Coupe des morceaux de texte de styles différents en lignes de largeur `maxW` (mm). */
function wrapRuns(doc: jsPDF, runs: Run[], size: number, maxW: number): Piece[][] {
  const tokens: { text: string; bold: boolean; color: RGB }[] = [];
  runs.forEach((run) =>
    run.text
      .split(/\s+/)
      .filter(Boolean)
      .forEach((word) => splitWord(doc, word, !!run.bold, size, maxW).forEach((text) => tokens.push({ text, bold: !!run.bold, color: run.color ?? BLACK })))
  );
  const lines: Piece[][] = [];
  let line: Piece[] = [];
  let x = 0;
  tokens.forEach((token) => {
    style(doc, size, token.bold);
    const width = measure(doc, token.text, size);
    const space = measure(doc, ' ', size);
    const start = line.length === 0 ? 0 : x + space;
    if (line.length > 0 && start + width > maxW) {
      lines.push(line);
      line = [];
      x = 0;
      line.push({ ...token, x: 0 });
      x = width;
    } else {
      line.push({ ...token, x: start });
      x = start + width;
    }
  });
  if (line.length > 0) lines.push(line);
  return lines;
}

/** Comme wrapRuns, mais avec des lignes de longueur voisine (pas de mot isolé à la dernière ligne). */
function wrapBalanced(doc: jsPDF, runs: Run[], size: number, maxW: number): Piece[][] {
  const lines = wrapRuns(doc, runs, size, maxW);
  if (lines.length < 2) return lines;
  let lo = maxW * 0.4;
  let hi = maxW;
  for (let i = 0; i < 18; i += 1) {
    const mid = (lo + hi) / 2;
    if (wrapRuns(doc, runs, size, mid).length > lines.length) lo = mid;
    else hi = mid;
  }
  return wrapRuns(doc, runs, size, hi);
}

function drawPieces(doc: jsPDF, line: Piece[], x: number, y: number, size: number) {
  line.forEach((piece) => {
    style(doc, size, piece.bold);
    doc.setTextColor(...piece.color);
    doc.text(piece.text, x + piece.x, y);
  });
}

const upper = (text: string) => text.toLocaleUpperCase('fr-FR');

// ── Pictogrammes des barres (dessinés, sans image) ───────────────────────────────────────────────
type Glyph = 'cross' | 'chalice' | 'speech';

function badge(doc: jsPDF, cx: number, cy: number, r: number, glyph: Glyph) {
  doc.setFillColor(...WHITE);
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.circle(cx, cy, r, 'FD');
  doc.setFillColor(...TEAL);
  doc.setDrawColor(...TEAL);
  const u = r / 5; // unité : un cinquième du rayon
  if (glyph === 'cross') {
    doc.rect(cx - 0.55 * u, cy - 3.2 * u, 1.1 * u, 6.4 * u, 'F');
    doc.rect(cx - 2.2 * u, cy - 1.6 * u, 4.4 * u, 1.1 * u, 'F');
  } else if (glyph === 'chalice') {
    doc.triangle(cx - 2.4 * u, cy - 3 * u, cx + 2.4 * u, cy - 3 * u, cx, cy + 0.6 * u, 'F');
    doc.rect(cx - 0.4 * u, cy + 0.4 * u, 0.8 * u, 2.2 * u, 'F');
    doc.rect(cx - 1.7 * u, cy + 2.4 * u, 3.4 * u, 0.7 * u, 'F');
  } else {
    doc.roundedRect(cx - 3 * u, cy - 2.4 * u, 6 * u, 4 * u, 0.8 * u, 0.8 * u, 'F');
    doc.triangle(cx - 1.6 * u, cy + 1.5 * u, cx - 0.2 * u, cy + 1.5 * u, cx - 1.6 * u, cy + 3.2 * u, 'F');
    doc.setDrawColor(...WHITE);
    doc.setLineWidth(0.35);
    doc.line(cx - 1.9 * u, cy - 0.9 * u, cx + 1.9 * u, cy - 0.9 * u);
    doc.line(cx - 1.9 * u, cy + 0.2 * u, cx + 0.9 * u, cy + 0.2 * u);
  }
}

// ── Pièces fixes de la page ──────────────────────────────────────────────────────────────────────
/** Plus grande taille (de `max` à `min`) pour laquelle le texte tient sur `width` mm ; `charSpace` : espacement ajouté entre les lettres. */
function fitSize(doc: jsPDF, text: string, bold: boolean, max: number, min: number, width: number, charSpace = 0): number {
  let size = max;
  style(doc, size, bold);
  while (size > min && measure(doc, text, size) + charSpace * text.length > width) {
    size -= 0.25;
    style(doc, size, bold);
  }
  return size;
}

/** Texte sur une ligne : réduit jusqu'à `min`, puis raccourci par « … » plutôt que de déborder sur le voisin. */
function fitText(doc: jsPDF, text: string, bold: boolean, max: number, min: number, width: number, charSpace = 0): { text: string; size: number } {
  const size = fitSize(doc, text, bold, max, min, width, charSpace);
  style(doc, size, bold);
  const wide = (t: string) => measure(doc, t, size) + charSpace * t.length;
  if (wide(text) <= width) return { text, size };
  let cut = text;
  while (cut.length > 1 && wide(`${cut.trimEnd()}…`) > width) cut = cut.slice(0, -1);
  return { text: `${cut.trimEnd()}…`, size };
}

/** Garde au plus `maxLines` lignes ; si le texte est plus long, la dernière se termine par « … » (rien ne disparaît sans que ça se voie). */
function clampLines(doc: jsPDF, lines: Piece[][], maxLines: number, size: number, maxW: number): Piece[][] {
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines).map((line) => line.map((piece) => ({ ...piece })));
  const last = kept[maxLines - 1];
  const reach = () => {
    const tail = last[last.length - 1];
    style(doc, size, tail.bold);
    return tail.x + measure(doc, `${tail.text}…`, size);
  };
  while (last.length > 1 && reach() > maxW) last.pop();
  last[last.length - 1].text += '…';
  return kept;
}

function drawHeader(doc: jsPDF, model: TimingSheetModel, assets: FicheAssets, firstPage: boolean) {
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.3);
  doc.line(-1, 11.3, 288.5, 11.3);
  doc.line(288.5, -1, 288.5, 11.3);

  if (firstPage && assets.flame) {
    // Flamme : mêmes position et taille que sur la fiche d'origine
    doc.addImage(assets.flame.dataUrl, assets.flame.format, 260.1, 0.9, 20.2, 17.7, 'fiche-flamme', 'FAST');
  }
  let titleX = 12;
  if (assets.logo) {
    const ratio = assets.logo.width / assets.logo.height;
    const h = Math.min(19.5 / ratio, 17); // un logo en hauteur ne doit pas toucher la bannière
    const w = h * ratio;
    doc.addImage(assets.logo.dataUrl, assets.logo.format, 4.5, 3, w, h, 'fiche-logo', 'FAST');
    titleX = 32.7;
  }
  const title = fitText(doc, model.title, true, 17, 10, 153.5);
  style(doc, title.size, true);
  doc.setTextColor(...TEAL);
  doc.text(title.text, titleX, 15);

  style(doc, 13, false);
  doc.setTextColor(...GRAY);
  doc.text(model.dateLabel, 254.6, 14.2, { align: 'right' });
}

function drawBanner(doc: jsPDF, model: TimingSheetModel) {
  doc.setFillColor(...TEAL);
  doc.setDrawColor(...BANNER_EDGE);
  doc.setLineWidth(0.45);
  doc.roundedRect(4.2, 22.2, BANNER_RIGHT - 4.2, 17.1, 3, 3, 'FD');
  doc.setTextColor(...WHITE);
  const base = 33.9;
  const big = 31;
  let x = 9;
  const { number, sup, text } = model.banner;
  if (number) {
    style(doc, big, true);
    doc.text(number, x, base);
    x += measure(doc, number, big) + 0.3;
    style(doc, big * 0.55, true);
    doc.text(sup ?? '', x, base - 4.6);
    x += measure(doc, sup ?? '', big * 0.55) + 2.2;
  }
  const label = fitText(doc, `${text} :`, true, big, 14, BANNER_RIGHT - 4 - x);
  style(doc, label.size, true);
  doc.text(label.text, x, base);
}

function drawFooter(doc: jsPDF, model: TimingSheetModel) {
  doc.setDrawColor(...HAIRLINE);
  doc.setLineWidth(0.3);
  doc.roundedRect(-3, 190.5, 291.5, 22, 2, 2, 'S');

  // verset (à gauche), la référence finale en vert et en gras
  if (model.verse) {
    const ref = model.verse.match(/^([\s\S]*?\S)\s+((?:[1-3]\s)?[A-ZÀ-Ý][A-Za-zÀ-ÿ]+\s+\d+\s*:\s*\d+(?:\s*[-–]\s*\d+)?)\.?\s*$/);
    const runs: Run[] = ref ? [{ text: ref[1] }, { text: ref[2], bold: true, color: TEAL }] : [{ text: model.verse }];
    let size = 9;
    let lines = wrapRuns(doc, runs, size, VERSE_W);
    while (lines.length > 3 && size > FOOTER_MIN_SIZE) {
      size -= 0.5;
      lines = wrapRuns(doc, runs, size, VERSE_W);
    }
    clampLines(doc, lines, 4, size, VERSE_W).forEach((line, i) => drawPieces(doc, line, 6, 198.6 + i * lineHeight(size), size));
  }
  // NB (à droite)
  if (model.footerNote) {
    const runs: Run[] = [{ text: `NB : ${model.footerNote}`, bold: true, color: NB_RED }];
    let size = 9;
    let lines = wrapBalanced(doc, runs, size, NOTE_W);
    while (lines.length > 3 && size > FOOTER_MIN_SIZE) {
      size -= 0.5;
      lines = wrapBalanced(doc, runs, size, NOTE_W);
    }
    clampLines(doc, lines, 4, size, NOTE_W).forEach((line, i) => drawPieces(doc, line, 186, 197.6 + i * lineHeight(size), size));
  }
}

// ── Colonnes ─────────────────────────────────────────────────────────────────────────────────────
/** Dessine (ou seulement mesure) la colonne de gauche ; renvoie la hauteur atteinte et si le bas de page est dépassé. */
function leftColumn(doc: jsPDF, model: TimingSheetModel, k: number, mode: { draw: boolean; breaks: boolean; ensurePage: (n: number) => void }) {
  let page = 1;
  let y = 65.7;
  let overflow = false;
  const labelW = LEFT.timeX - LEFT.labelX - 2;

  const need = (h: number) => {
    if (y + h <= CONTENT_BOTTOM) return;
    if (!mode.breaks) {
      overflow = true;
      return;
    }
    page += 1;
    if (mode.draw) mode.ensurePage(page);
    y = CONTINUATION_TOP;
  };

  blocks: for (const block of model.blocks as SheetBlock[]) {
    if (block.kind === 'moment') {
      const size = 12 * k;
      style(doc, size, true);
      const lines = wrapRuns(doc, [{ text: upper(block.label), bold: true }], size, LEFT.right - LEFT.x);
      const extra = (lines.length - 1) * lineHeight(size); // intitulé long : il passe à la ligne
      // le titre ne reste jamais seul en bas de page : on réserve aussi la place de la séquence qui le suit
      need((y > 66 ? 4.5 * k : 0) + 6.6 * k + extra + lineHeight(size) + 1.8 * k);
      if (overflow) break blocks;
      if (y > 66) y += 4.5 * k;
      if (mode.draw) lines.forEach((line, i) => drawPieces(doc, line, LEFT.x, y + i * lineHeight(size), size));
      y += 6.6 * k + extra;
    } else {
      const size = 12 * k;
      style(doc, size, false);
      const lines = wrapRuns(doc, [{ text: block.label }], size, labelW);
      const height = lines.length * lineHeight(size) + 1.8 * k;
      need(height);
      if (overflow) break blocks;
      if (mode.draw) {
        lines.forEach((line, i) => drawPieces(doc, line, LEFT.labelX, y + i * lineHeight(size), size));
        if (block.range) {
          style(doc, size * 0.97, true);
          doc.setTextColor(...TEAL);
          doc.text(block.range, LEFT.timeX, y);
        }
        if (block.duration) {
          style(doc, 11.5 * k, true);
          doc.setTextColor(...BLACK);
          doc.text(block.duration, LEFT.durationX, y);
        }
      }
      y += height;
    }
  }
  return { endY: y, overflow, pages: page };
}

/** Une annonce : « N- Titre en rouge texte… » puis les puces ; renvoie les lignes prêtes à dessiner. */
interface DrawLine {
  pieces: Piece[];
  x: number;
  check?: boolean;
  gapBefore: number;
}

function announcementLines(doc: jsPDF, items: AnnouncementItem[], size: number): DrawLine[] {
  const width = RIGHT.textRight - RIGHT.textX;
  const bulletIndent = 5;
  const out: DrawLine[] = [];
  items.forEach((item, n) => {
    const runs: Run[] = [{ text: `${n + 1}-`, bold: true }];
    if (item.title) runs.push({ text: item.title, bold: true, color: RED });
    if (item.lead) runs.push({ text: item.lead });
    const first = wrapRuns(doc, runs, size, width);
    first.forEach((pieces, i) => out.push({ pieces, x: RIGHT.textX, gapBefore: i === 0 ? (n === 0 ? 0 : 1.6) : 0 }));
    item.text.forEach((paragraph) => {
      wrapRuns(doc, [{ text: paragraph }], size, width).forEach((pieces) => out.push({ pieces, x: RIGHT.textX, gapBefore: 0 }));
    });
    item.bullets.forEach((bullet) => {
      const bulletRuns: Run[] = [];
      if (bullet.label) bulletRuns.push({ text: bullet.label, bold: true });
      if (bullet.text) bulletRuns.push({ text: bullet.text });
      wrapRuns(doc, bulletRuns, size, width - bulletIndent).forEach((pieces, i) =>
        out.push({ pieces, x: RIGHT.textX + bulletIndent, check: i === 0, gapBefore: 0 })
      );
    });
  });
  return out;
}

function drawCheck(doc: jsPDF, x: number, y: number, size: number) {
  const s = size * PT * 0.5;
  doc.setDrawColor(...BLACK);
  doc.setLineWidth(0.3);
  doc.line(x, y - s * 0.45, x + s * 0.35, y);
  doc.line(x + s * 0.35, y, x + s * 1.05, y - s * 0.95);
}

/** Dessine (ou mesure) la colonne de droite : Sainte Cène, annonces du pasteur, annonces du dirigeant. */
function rightColumn(doc: jsPDF, model: TimingSheetModel, k: number, mode: { draw: boolean; breaks: boolean; ensurePage: (n: number) => void }) {
  let page = 1;
  let y = 44.7;
  let overflow = false;
  const size = 10.5 * k;
  const lh = lineHeight(size);

  const need = (h: number) => {
    if (y + h <= CONTENT_BOTTOM) return;
    if (!mode.breaks) {
      overflow = true;
      return;
    }
    page += 1;
    if (mode.draw) mode.ensurePage(page);
    y = CONTINUATION_TOP;
  };

  // Sainte Cène
  if (model.communionLeads) {
    const label = 'SAINTE CÈNE';
    style(doc, 10, true);
    const labelEnd = RIGHT.barX + 5.2 + measure(doc, label, 10) + 1.6;
    const room = RIGHT.barRight - labelEnd - 2;
    const text = `: ${model.communionLeads}`;
    // Une ligne tant que le texte reste lisible (8 pt au moins) ; au-delà, deux lignes dans une barre plus haute
    const single = fitText(doc, text, true, 13, 8, room);
    const twoLines = single.text !== text;
    let lines: Piece[][] = [];
    let size = 10;
    if (twoLines) {
      const runs: Run[] = [{ text, bold: true, color: WHITE }];
      lines = wrapRuns(doc, runs, size, room);
      while (lines.length > 2 && size > 7.5) {
        size -= 0.5;
        lines = wrapRuns(doc, runs, size, room);
      }
      lines = clampLines(doc, lines, 2, size, room);
    }
    const h = twoLines ? 2 * lineHeight(size) + 2.6 : 6.7;
    if (mode.draw) {
      gradientBar(doc, RIGHT.barX, y, RIGHT.barRight - RIGHT.barX, h);
      badge(doc, RIGHT.barX - 1.5, y + h / 2, 5.4, 'chalice');
      style(doc, 10, true);
      doc.setTextColor(...WHITE);
      doc.text(label, RIGHT.barX + 5.2, y + h / 2 + 10 * PT * 0.35);
      if (twoLines) {
        const first = y + 1.3 + lineHeight(size) * 0.78;
        lines.forEach((line, i) => drawPieces(doc, line, labelEnd, first + i * lineHeight(size), size));
      } else {
        style(doc, single.size, true);
        doc.text(single.text, labelEnd, y + 4.8);
      }
    }
    y += h + 6.5;
  }

  const section = (label: string, glyph: Glyph, items: AnnouncementItem[], barH: number, labelSize: number) => {
    if (items.length === 0) return;
    need(barH + lh * 2);
    if (overflow) return;
    if (mode.draw) {
      gradientBar(doc, RIGHT.barX, y, RIGHT.barRight - RIGHT.barX, barH);
      badge(doc, RIGHT.barX - 1.5, y + barH / 2, barH / 2 + 1.6, glyph);
      style(doc, labelSize, true);
      doc.setTextColor(...WHITE);
      doc.text(label, RIGHT.barX + barH / 2 + 4.2, y + barH / 2 + labelSize * PT * 0.35);
    }
    y += barH + 4.4 + size * PT * 0.8;
    const lines = announcementLines(doc, items, size);
    lines.forEach((line) => {
      y += line.gapBefore * k;
      need(lh);
      if (overflow) return;
      if (mode.draw) {
        if (line.check) drawCheck(doc, RIGHT.textX + 0.4, y, size);
        drawPieces(doc, line.pieces, line.x, y, size);
      }
      y += lh;
    });
    y += 4.5 * k;
  };

  section('ANNONCES PASTEUR', 'cross', model.pastorAnnouncements, 9.4, 12.5);
  section('ANNONCES Dirigeant', 'speech', model.leaderAnnouncements, 6.6, 10.5);
  return { endY: y, overflow, pages: page };
}

/** Plus grande échelle (1 → `min`) à laquelle la colonne tient sur la page ; `min` si aucune ne convient. */
function bestScale(fits: (k: number) => boolean, min: number): number {
  for (let k = 1; k > min; k -= 0.05) {
    if (fits(k)) return Math.round(k * 100) / 100;
  }
  return min;
}

// Échelles minimales : en dessous, le texte passerait sous ~8 pt, illisible sur papier
const MIN_SCALE_LEFT = 0.67;
const MIN_SCALE_RIGHT = 0.76;

// ── Page complète ────────────────────────────────────────────────────────────────────────────────
export function buildTimingSheetPdf(source: TimingSheetModel, assets: FicheAssets = {}): jsPDF {
  const model = printableDeep(source);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  doc.setProperties({
    title: `Fiche de timing - ${[model.banner.number, model.banner.sup, ' ', model.banner.text].filter(Boolean).join('')} - ${model.dateLabel}`,
    subject: model.title,
    creator: 'Bergerie',
  });

  const headed = new Set<number>([1]);
  const ensurePage = (n: number) => {
    while (doc.getNumberOfPages() < n) doc.addPage();
    doc.setPage(n);
    if (!headed.has(n)) {
      headed.add(n);
      drawHeader(doc, model, assets, false);
      style(doc, 11, false);
      doc.setTextColor(...GRAY);
      doc.text('(suite)', 12, 24.5);
    }
  };

  drawHeader(doc, model, assets, true);
  drawBanner(doc, model);

  // colonne de gauche : prédicateur, dirigeant
  if (model.preacher) {
    const preacher = fitText(doc, model.preacher, false, 15, 10, LEFT.right - 14);
    style(doc, preacher.size, false);
    doc.setTextColor(...BLACK);
    doc.text(preacher.text, 14.2, 48);
  }
  if (model.leader) {
    gradientBar(doc, 16.2, 52.3, LEFT.right - 16.2, 6.8);
    badge(doc, 10.8, 55.7, 5.4, 'cross');
    const leader = fitText(doc, `CULTE : ${model.leader}`, true, 12.5, 8.5, LEFT.right - 16.2 - 8, CHAR_SPACE);
    style(doc, leader.size, true);
    doc.setTextColor(...WHITE);
    doc.setCharSpace(CHAR_SPACE); // l'intitulé est aéré sur la fiche d'origine
    doc.text(leader.text, 22, 57);
    doc.setCharSpace(0);
  }

  const noop = () => undefined;
  const measureLeft = (k: number) => leftColumn(doc, model, k, { draw: false, breaks: false, ensurePage: noop }).overflow;
  const measureRight = (k: number) => rightColumn(doc, model, k, { draw: false, breaks: false, ensurePage: noop }).overflow;
  const kLeft = bestScale((k) => !measureLeft(k), MIN_SCALE_LEFT);
  const kRight = bestScale((k) => !measureRight(k), MIN_SCALE_RIGHT);
  // Même à l'échelle minimale la colonne ne tient pas : elle continue sur une page supplémentaire
  const leftOverflows = measureLeft(kLeft);
  const rightOverflows = measureRight(kRight);

  doc.setPage(1);
  leftColumn(doc, model, kLeft, { draw: true, breaks: leftOverflows, ensurePage });
  doc.setPage(1);
  rightColumn(doc, model, kRight, { draw: true, breaks: rightOverflows, ensurePage });

  // pied de page sur toutes les pages
  for (let p = 1; p <= doc.getNumberOfPages(); p += 1) {
    doc.setPage(p);
    drawFooter(doc, model);
  }
  doc.setPage(1);
  return doc;
}
