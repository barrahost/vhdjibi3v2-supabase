import { PrayerRequest, PRAYER_CATEGORIES } from '../../services/prayerRequest.service';

// Export texte (.txt) des sujets de prière : pensé pour être lu, imprimé ou
// partagé aux intercesseurs. Volontairement sans numéros de téléphone —
// les contacts restent dans l'appli et dans l'export Excel.

interface TxtExportOptions {
  churchName?: string;
  startDate?: string; // YYYY-MM-DD — période réellement appliquée au filtre
  endDate?: string;   // YYYY-MM-DD
}

// 'YYYY-MM-DD' -> Date locale à midi (évite les glissements de fuseau)
function parseDateStr(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

function frLongDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function frShortDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

// 'YYYY-MM-DD' -> 'DD-MM-YYYY' (pour le nom de fichier)
function fileDate(s: string): string {
  const [y, m, d] = s.split('-');
  return `${d}-${m}-${y}`;
}

function periodLine(opts: TxtExportOptions): string | null {
  if (opts.startDate && opts.endDate) {
    return `Période : du ${frLongDate(parseDateStr(opts.startDate))} au ${frLongDate(parseDateStr(opts.endDate))}`;
  }
  if (opts.startDate) return `Période : depuis le ${frLongDate(parseDateStr(opts.startDate))}`;
  if (opts.endDate) return `Période : jusqu'au ${frLongDate(parseDateStr(opts.endDate))}`;
  return null;
}

export function exportPrayerRequestsTxt(requests: PrayerRequest[], opts: TxtExportOptions = {}): void {
  const lines: string[] = [];

  lines.push(opts.churchName ? `CHAÎNE DE PRIÈRE — ${opts.churchName.toUpperCase()}` : 'CHAÎNE DE PRIÈRE');
  const period = periodLine(opts);
  if (period) lines.push(period);
  lines.push(`${requests.length} sujet${requests.length > 1 ? 's' : ''} — exporté le ${frLongDate(new Date())}`);
  lines.push('');
  lines.push('═'.repeat(46));

  // Catégories dans l'ordre du formulaire, puis les éventuelles inconnues
  const knownCats = PRAYER_CATEGORIES.filter(c => requests.some(r => r.category === c));
  const otherCats = [...new Set(requests.map(r => String(r.category)))]
    .filter(c => !(PRAYER_CATEGORIES as readonly string[]).includes(c));

  for (const cat of [...knownCats, ...otherCats]) {
    const group = requests
      .filter(r => String(r.category) === String(cat))
      .sort((a, b) => a.submittedAt.getTime() - b.submittedAt.getTime());

    lines.push('');
    lines.push(`${String(cat).toUpperCase()} (${group.length} sujet${group.length > 1 ? 's' : ''})`);
    lines.push('─'.repeat(32));

    group.forEach((r, i) => {
      lines.push('');
      // Le sujet garde ses propres retours à la ligne, indentés sous le numéro
      const [first, ...rest] = (r.subject || '').trim().replace(/\r\n/g, '\n').split('\n');
      lines.push(`${i + 1}. ${first}`);
      rest.forEach(l => lines.push(`   ${l.trim()}`));
      lines.push(`   — ${r.fullName || 'Anonyme'} · soumis le ${frShortDate(r.submittedAt)}`);
    });
    lines.push('');
  }

  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
  const filename = opts.startDate && opts.endDate
    ? `sujets-de-priere-du-${fileDate(opts.startDate)}-au-${fileDate(opts.endDate)}.txt`
    : `sujets-de-priere-${todayStr}.txt`;

  // BOM UTF-8 pour que les accents s'affichent partout (Bloc-notes Windows inclus)
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
