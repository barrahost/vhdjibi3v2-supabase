import * as XLSX from 'xlsx';
import { collection, getDocs, writeBatch, doc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface ParsedRow {
  rowNumber: number; // ligne dans le fichier Excel (1-indexed)
  raw: {
    firstVisitDate: string;
    fullName: string;
    nickname: string;
    gender: string;
    phone: string;
    location: string;
    serviceFamily: string;
    originSource: string;
    isUndecided: string;
    remarks: string;
  };
  parsed: {
    firstVisitDate?: Date;
    fullName: string;
    nickname?: string;
    gender?: 'male' | 'female';
    phone: string;
    location: string;
    serviceFamilyId?: string;
    originSource?: 'culte' | 'evangelisation';
    isUndecided: boolean;
  };
  errors: string[];
  warnings: string[];
  status: 'valid' | 'warning' | 'invalid';
}

const HEADERS = [
  'Date 1ère visite (JJ/MM/AAAA)',
  'Nom complet',
  'Surnom',
  'Genre (Homme/Femme)',
  'Téléphone (10 chiffres)',
  'Lieu d\'habitation',
  'Famille de service',
  'Provenance (Culte/Evangelisation)',
  'Âme indécise (Oui/Non)',
  'Remarques',
];

const norm = (s: string) =>
  (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

function parseFrenchDate(value: any): Date | undefined {
  if (!value && value !== 0) return undefined;
  // Excel date number
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const str = value.toString().trim();
  const m = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (!m) return undefined;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10);
  let year = parseInt(m[3], 10);
  if (year < 100) year += 2000;
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return undefined;
  return d;
}

export async function parseSoulsFile(file: File): Promise<ParsedRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array', cellDates: false });
  const sheet = wb.Sheets['Import Âmes'] || wb.Sheets[wb.SheetNames[0]];
  if (!sheet) throw new Error('Feuille "Import Âmes" introuvable.');

  // Données à partir de la ligne 4 (range:3 en 0-index)
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 3, defval: '' });

  // Pré-charger familles + téléphones existants
  const [familiesSnap, soulsSnap] = await Promise.all([
    getDocs(collection(db, 'serviceFamilies')),
    getDocs(collection(db, 'souls')),
  ]);
  const familyMap = new Map<string, string>();
  familiesSnap.docs.forEach((d) => {
    const data = d.data() as any;
    if (data?.name) familyMap.set(norm(data.name), d.id);
  });
  const existingPhones = new Set<string>();
  soulsSnap.docs.forEach((d) => {
    const p = (d.data() as any)?.phone;
    if (p) existingPhones.add(p.toString().replace(/\D/g, '').slice(-10));
  });

  const seenPhonesInFile = new Set<string>();
  const result: ParsedRow[] = [];

  rows.forEach((row, idx) => {
    const rowNumber = idx + 4;
    const raw = {
      firstVisitDate: (row[0] ?? '').toString(),
      fullName: (row[1] ?? '').toString().trim(),
      nickname: (row[2] ?? '').toString().trim(),
      gender: (row[3] ?? '').toString().trim(),
      phone: (row[4] ?? '').toString().trim(),
      location: (row[5] ?? '').toString().trim(),
      serviceFamily: (row[6] ?? '').toString().trim(),
      originSource: (row[7] ?? '').toString().trim(),
      isUndecided: (row[8] ?? '').toString().trim(),
      remarks: (row[9] ?? '').toString().trim(),
    };

    // Ligne entièrement vide → on l'ignore
    const isEmpty = Object.values(raw).every((v) => !v);
    if (isEmpty) return;

    const errors: string[] = [];
    const warnings: string[] = [];

    // Date
    const date = parseFrenchDate(row[0]);
    if (!date) errors.push('Date de 1ère visite invalide (attendu JJ/MM/AAAA).');

    // Nom
    if (!raw.fullName) errors.push('Nom complet manquant.');

    // Genre
    let gender: 'male' | 'female' | undefined;
    const g = norm(raw.gender);
    if (g === 'homme' || g === 'h' || g === 'm') gender = 'male';
    else if (g === 'femme' || g === 'f') gender = 'female';
    else errors.push('Genre invalide (Homme ou Femme).');

    // Téléphone
    const digits = raw.phone.replace(/\D/g, '');
    let phone = '';
    if (!/^\d{10}$/.test(digits)) {
      errors.push('Téléphone invalide (10 chiffres requis).');
    } else {
      phone = digits;
      if (existingPhones.has(phone)) warnings.push('Téléphone déjà existant en base.');
      if (seenPhonesInFile.has(phone)) warnings.push('Téléphone en double dans le fichier.');
      seenPhonesInFile.add(phone);
    }

    // Lieu
    if (!raw.location) errors.push('Lieu d\'habitation manquant.');

    // Famille de service (optionnel)
    let serviceFamilyId: string | undefined;
    if (raw.serviceFamily) {
      const fid = familyMap.get(norm(raw.serviceFamily));
      if (!fid) warnings.push(`Famille « ${raw.serviceFamily} » introuvable — sera ignorée.`);
      else serviceFamilyId = fid;
    }

    // Provenance (optionnel)
    let originSource: 'culte' | 'evangelisation' | undefined;
    if (raw.originSource) {
      const o = norm(raw.originSource);
      if (o === 'culte') originSource = 'culte';
      else if (o.startsWith('evang')) originSource = 'evangelisation';
      else warnings.push('Provenance non reconnue — sera ignorée.');
    }

    // Indécise
    const u = norm(raw.isUndecided);
    const isUndecided = u === 'oui' || u === 'yes' || u === 'true' || u === '1';

    const status: ParsedRow['status'] =
      errors.length > 0 ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';

    result.push({
      rowNumber,
      raw,
      parsed: {
        firstVisitDate: date,
        fullName: raw.fullName,
        nickname: raw.nickname || undefined,
        gender,
        phone,
        location: raw.location,
        serviceFamilyId,
        originSource,
        isUndecided,
      },
      errors,
      warnings,
      status,
    });
  });

  return result;
}

export async function importSouls(
  rows: ParsedRow[],
  createdBy: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ imported: number; skipped: number }> {
  const importable = rows.filter((r) => r.status !== 'invalid');
  const total = importable.length;
  let done = 0;
  const BATCH_SIZE = 10;

  for (let i = 0; i < importable.length; i += BATCH_SIZE) {
    const slice = importable.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    const now = Timestamp.now();

    slice.forEach((r) => {
      const ref = doc(collection(db, 'souls'));
      const payload: any = {
        fullName: r.parsed.fullName,
        gender: r.parsed.gender,
        phone: '+225' + r.parsed.phone,
        location: r.parsed.location,
        isUndecided: r.parsed.isUndecided,
        firstVisitDate: r.parsed.firstVisitDate
          ? Timestamp.fromDate(r.parsed.firstVisitDate)
          : now,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        createdBy,
        spiritualProfile: {
          isBornAgain: false,
          isBaptized: false,
          isEnrolledInAcademy: false,
          isEnrolledInLifeBearers: false,
          departments: [],
        },
      };
      if (r.parsed.nickname) payload.nickname = r.parsed.nickname;
      if (r.parsed.serviceFamilyId) payload.serviceFamilyId = r.parsed.serviceFamilyId;
      if (r.parsed.originSource) payload.originSource = r.parsed.originSource;

      batch.set(ref, payload);
    });

    await batch.commit();
    done += slice.length;
    onProgress?.(done, total);
  }

  return { imported: done, skipped: rows.length - importable.length };
}

export function downloadTemplate(familyNames: string[] = []) {
  const wb = XLSX.utils.book_new();

  const aoa: any[][] = [
    ['MODÈLE D\'IMPORT — Vases d\'Honneur Assemblée Grâce Confondante'],
    ['Remplissez les lignes ci-dessous (à partir de la ligne 4). Les colonnes marquées * sont obligatoires.'],
    HEADERS,
    ['01/01/2025', 'Patrice Tano', 'Pat', 'Homme', '0707000001', 'Cocody Angré', '', 'Culte', 'Non', 'Exemple'],
    ['02/01/2025', 'Aïcha Koné', '', 'Femme', '0505000002', 'Yopougon', '', 'Evangelisation', 'Non', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', ''],
  ];

  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 22 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 },
    { wch: 22 }, { wch: 22 }, { wch: 26 }, { wch: 16 }, { wch: 28 },
  ];

  // Fusion du titre et sous-titre
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
  ];

  // Listes déroulantes (Genre D, Famille G, Provenance H, Indécise I) — lignes 4 à 1000
  const validations: any[] = [
    { sqref: 'D4:D1000', type: 'list', formula1: '"Homme,Femme"' },
    { sqref: 'H4:H1000', type: 'list', formula1: '"Culte,Evangelisation"' },
    { sqref: 'I4:I1000', type: 'list', formula1: '"Oui,Non"' },
  ];
  if (familyNames.length > 0) {
    const list = familyNames.map((n) => n.replace(/"/g, '')).join(',');
    if (list.length < 250) {
      validations.push({ sqref: 'G4:G1000', type: 'list', formula1: `"${list}"` });
    }
  }
  (ws as any)['!dataValidation'] = validations;

  XLSX.utils.book_append_sheet(wb, ws, 'Import Âmes');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Modele_Import_Ames.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
