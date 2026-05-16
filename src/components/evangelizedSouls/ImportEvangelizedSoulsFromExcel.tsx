import { useRef, useState, useEffect } from 'react';
import { collection, db, doc, writeBatch } from '../../lib/firebase';
import * as XLSX from 'xlsx';
import { Modal } from '../ui/Modal';
import { Upload, AlertTriangle, CheckCircle2, Loader2, UserX, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  PLANNED_SERVICE_OPTIONS,
  type GaveLifeToJesus,
  type PlannedService,
} from '../../types/evangelized.types';
import { useAuth } from '../../contexts/AuthContext';
import { isAdminUser, isADNUser } from '../../utils/roleHelpers';
import EvangelistSelect from './EvangelistSelect';
import { supabase } from '../../lib/supabase';

interface EvangelistOption {
  id: string;
  fullName: string;
}

interface ParsedRow {
  rowNumber: number;
  fullName: string;
  nickname: string | null;
  gender: 'male' | 'female' | null;
  phone: string;
  location: string;
  evangelizationDate: Date | null;
  evangelizationLocation: string | null;
  notes: string | null;
  attendedCommunity: string | null;
  gaveLifeToJesus: GaveLifeToJesus | null;
  plannedService: PlannedService | null;
  prayerTopics: string | null;
  interviewerName: string | null;
  // Évangéliste résolu
  evangelistId: string | null;
  evangelistMatchName: string | null;  // nom trouvé dans l'appli
  evangelistInputRaw: string | null;   // ce qui était écrit dans le fichier
  evangelistNotFound: boolean;         // colonne remplie mais aucun match
  errors: string[];
  rowStatus: 'valid' | 'error' | 'db_duplicate' | 'file_duplicate';
}

interface Props {
  onImported?: () => void;
}

const FR_DATE = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function parseDate(raw: any): Date | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
  if (typeof raw === 'number') {
    const parsed = (XLSX as any).SSF?.parse_date_code?.(raw);
    if (parsed) {
      const d = new Date(parsed.y, parsed.m - 1, parsed.d);
      if (!isNaN(d.getTime())) return d;
    }
  }
  const s = String(raw).trim();
  let m = s.match(ISO_DATE);
  if (m) { const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])); if (!isNaN(d.getTime())) return d; }
  m = s.match(FR_DATE);
  if (m) { const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])); if (!isNaN(d.getTime())) return d; }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseGender(raw: any): 'male' | 'female' | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (['m', 'male', 'masculin', 'h', 'homme'].includes(s)) return 'male';
  if (['f', 'female', 'féminin', 'feminin', 'femme'].includes(s)) return 'female';
  return null;
}

function cellStr(raw: any): string {
  if (raw == null) return '';
  return String(raw).trim();
}

function isRowEmpty(row: any[]): boolean {
  return !row || row.every((c) => c == null || String(c).trim() === '');
}

function parseYesNoNotYet(raw: any): { value: GaveLifeToJesus | null; invalid: boolean } {
  const s = cellStr(raw);
  if (!s) return { value: null, invalid: false };
  const n = normalize(s);
  if (['oui', 'yes', 'o', 'y'].includes(n)) return { value: 'yes', invalid: false };
  if (['non', 'no', 'n'].includes(n)) return { value: 'no', invalid: false };
  if (['pas encore', 'not yet', 'pasencore', 'pas-encore'].includes(n)) return { value: 'not_yet', invalid: false };
  return { value: null, invalid: true };
}

function parsePlannedService(raw: any): { value: PlannedService | null; invalid: boolean } {
  const s = cellStr(raw);
  if (!s) return { value: null, invalid: false };
  const n = normalize(s);
  const direct = PLANNED_SERVICE_OPTIONS.find((o) => o.value === n);
  if (direct) return { value: direct.value, invalid: false };
  const byLabel = PLANNED_SERVICE_OPTIONS.find((o) => normalize(o.label) === n);
  if (byLabel) return { value: byLabel.value, invalid: false };
  if (n.includes('mercredi')) return { value: 'wednesday_evening', invalid: false };
  if (n.includes('1er') || n.includes('premier') || n.includes('7h')) return { value: 'sunday_first', invalid: false };
  if (n.includes('2e') || n.includes('deuxieme') || n.includes('10h')) return { value: 'sunday_second', invalid: false };
  if (n.includes('pas encore') || n.includes('indecis') || n.includes('undecided')) return { value: 'undecided', invalid: false };
  return { value: null, invalid: true };
}

/**
 * Matching flou : retourne l'évangéliste dont le nom contient le plus de mots
 * présents dans la saisie (et vice-versa). Insensible à la casse et aux accents.
 * Ex: "FIDELE" matche "YAO FIDELE", "YAO" aussi.
 */
function matchEvangelist(input: string, evangelists: EvangelistOption[]): EvangelistOption | null {
  const inp = normalize(input);
  if (!inp) return null;

  // 1. Correspondance exacte
  const exact = evangelists.find(e => normalize(e.fullName) === inp);
  if (exact) return exact;

  const inputWords = inp.split(/\s+/).filter(w => w.length >= 2);
  if (inputWords.length === 0) return null;

  let bestMatch: EvangelistOption | null = null;
  let bestScore = 0;

  for (const ev of evangelists) {
    const nameWords = normalize(ev.fullName).split(/\s+/);
    let score = 0;

    for (const iw of inputWords) {
      // mot exact dans le nom OU le nom contient ce mot OU ce mot contient un mot du nom
      if (nameWords.some(nw => nw === iw || nw.includes(iw) || iw.includes(nw))) {
        score++;
      }
    }

    // Bonus : le nom entier contient la saisie
    if (normalize(ev.fullName).includes(inp)) score += 0.5;

    if (score > 0 && score > bestScore) {
      bestScore = score;
      bestMatch = ev;
    }
  }

  return bestMatch;
}

export default function ImportEvangelizedSoulsFromExcel({ onImported }: Props) {
  const { user, userRole, activeRole } = useAuth();
  const isAdmin = isAdminUser({ role: (activeRole || userRole) as string, businessProfiles: (user as any)?.businessProfiles });
  const isADN = isADNUser({ role: (activeRole || userRole) as string, businessProfiles: (user as any)?.businessProfiles });
  const canChooseEvangelist = isAdmin || isADN;

  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [globalEvangelistId, setGlobalEvangelistId] = useState<string | undefined>(undefined);
  const [evangelists, setEvangelists] = useState<EvangelistOption[]>([]);

  // Charger les évangélistes une fois
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await supabase.from('users').select('*').eq('status', 'active').then(r=>r);
        const data = snap.docs
          .map(d => {
            const u: any = d.data();
            const profiles: any[] = Array.isArray(u.businessProfiles) ? u.businessProfiles : [];
            const isEv = u.role === 'evangelist' || profiles.some((p: any) => p?.type === 'evangelist' && p?.isActive !== false);
            if (!isEv) return null;
            return { id: d.id, fullName: u.fullName || '' } as EvangelistOption;
          })
          .filter((e): e is EvangelistOption => e !== null && !!e.fullName);
        setEvangelists(data);
      } catch (e) {
        console.error('Error loading evangelists:', e);
      }
    };
    load();
  }, []);

  const [checkingDuplicates, setCheckingDuplicates] = useState(false);

  // Vérification des doublons Firestore après chaque parsing
  useEffect(() => {
    const validParsed = rows.filter(r => r.rowStatus === 'valid');
    if (validParsed.length === 0) return;

    const checkDB = async () => {
      setCheckingDuplicates(true);
      try {
        const snap = await supabase.from('evangelized_souls').select('*');
        const existingPhones = new Set<string>();
        const existingNames = new Set<string>();
        snap.forEach(d => {
          const data = d.data();
          if (data.phone) existingPhones.add(data.phone);
          if (data.fullName) existingNames.add(normalize(data.fullName));
        });

        setRows(prev => prev.map(r => {
          if (r.rowStatus !== 'valid') return r;
          const phoneMatch = r.phone && existingPhones.has(r.phone);
          const nameMatch = !r.phone && r.fullName && existingNames.has(normalize(r.fullName));
          if (phoneMatch || nameMatch) {
            return {
              ...r,
              rowStatus: 'db_duplicate' as const,
              errors: [r.phone ? "Numéro déjà présent dans l'application" : "Nom déjà présent dans l'application"],
            };
          }
          return r;
        }));
      } catch (err) {
        console.error('Erreur vérification doublons:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    };
    checkDB();
  }, [rows.length]);

  const validRows = rows.filter(r => r.rowStatus === 'valid');
  const invalidRows = rows.filter(r => r.rowStatus === 'error');
  const dbDuplicateRows = rows.filter(r => r.rowStatus === 'db_duplicate');
  const fileDuplicateRows = rows.filter(r => r.rowStatus === 'file_duplicate');
  const unmatchedRows = validRows.filter(r => r.evangelistNotFound);
  const unassignedRows = validRows.filter(r => !r.evangelistId && !r.evangelistNotFound && !r.evangelistInputRaw);

  const reset = () => {
    setRows([]);
    setParsing(false);
    setImporting(false);
    setGlobalEvangelistId(undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleClose = () => {
    if (importing) return;
    setOpen(false);
    reset();
  };

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) { toast.error('Veuillez sélectionner un fichier .xlsx ou .xls'); return; }
    setParsing(true);
    setOpen(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) { toast.error('Aucune feuille trouvée'); setOpen(false); return; }

      const aoa = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, range: 1, defval: null, blankrows: false });
      const dataRows = aoa.slice(1);
      const parsed: ParsedRow[] = [];

      dataRows.forEach((row, idx) => {
        if (isRowEmpty(row)) return;
        const excelRow = idx + 3;

        const fullName = cellStr(row[0]);
        const nickname = cellStr(row[1]);
        const gender = parseGender(row[2]);
        const phone = cellStr(row[3]);
        const location = cellStr(row[4]);
        const date = parseDate(row[5]);
        const evangelizationLocation = cellStr(row[6]);
        const notes = cellStr(row[7]);
        const attendedCommunity = cellStr(row[8]);
        const gaveLife = parseYesNoNotYet(row[9]);
        const planned = parsePlannedService(row[10]);
        const prayerTopics = cellStr(row[11]);
        const interviewerName = cellStr(row[12]);
        const evangelistRaw = cellStr(row[13]);

        // Résolution évangéliste par matching flou
        let evangelistId: string | null = null;
        let evangelistMatchName: string | null = null;
        let evangelistNotFound = false;

        if (evangelistRaw) {
          const matched = matchEvangelist(evangelistRaw, evangelists);
          if (matched) {
            evangelistId = matched.id;
            evangelistMatchName = matched.fullName;
          } else {
            evangelistNotFound = true;
          }
        }

        const errors: string[] = [];
        if (!fullName) errors.push('Nom et Prénoms manquant');
        if (!gender) errors.push(`Genre invalide ("${cellStr(row[2])}")`);
        if (!location) errors.push("Lieu d'habitation manquant");
        if (!date) errors.push(`Date d'évangélisation invalide ("${cellStr(row[5])}")`);
        if (gaveLife.invalid) errors.push(`"A donné sa vie" invalide ("${cellStr(row[9])}")`);
        if (planned.invalid) errors.push(`Culte invalide ("${cellStr(row[10])}")`);

        parsed.push({
          rowNumber: excelRow, fullName, nickname: nickname || null,
          gender, phone, location, evangelizationDate: date,
          evangelizationLocation: evangelizationLocation || null,
          notes: notes || null, attendedCommunity: attendedCommunity || null,
          gaveLifeToJesus: gaveLife.value, plannedService: planned.value,
          prayerTopics: prayerTopics || null, interviewerName: interviewerName || null,
          evangelistId, evangelistMatchName,
          evangelistInputRaw: evangelistRaw || null,
          evangelistNotFound, errors,
          rowStatus: errors.length > 0 ? 'error' : 'valid',
        });
      });

      if (parsed.length === 0) { toast.error('Aucune ligne trouvée'); setOpen(false); return; }

      // Doublons intra-fichier (même téléphone dans le fichier)
      const phoneCountMap: Record<string, number> = {};
      parsed.forEach(r => {
        if (r.phone) phoneCountMap[r.phone] = (phoneCountMap[r.phone] || 0) + 1;
      });
      const nameCountMap: Record<string, number> = {};
      parsed.forEach(r => {
        const key = normalize(r.fullName);
        if (key) nameCountMap[key] = (nameCountMap[key] || 0) + 1;
      });
      const withFileDupes = parsed.map(r => {
        if (r.rowStatus === 'error') return r;
        const phonedup = r.phone && (phoneCountMap[r.phone] || 0) > 1;
        const namedup = !r.phone && normalize(r.fullName) && (nameCountMap[normalize(r.fullName)] || 0) > 1;
        if (phonedup || namedup) {
          return { ...r, rowStatus: 'file_duplicate' as const, errors: ['Doublon dans le fichier'] };
        }
        return r;
      });
      setRows(withFileDupes);
    } catch (e) {
      console.error('Excel parse error:', e);
      toast.error('Erreur lors de la lecture du fichier');
      setOpen(false);
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    const userStr = localStorage.getItem('user');
    if (!userStr) { toast.error('Session expirée.'); return; }
    const currentUser = JSON.parse(userStr);

    setImporting(true);
    try {
      const now = new Date();
      for (let i = 0; i < validRows.length; i += 500) {
        const chunk = validRows.slice(i, i + 500);
        const batch = writeBatch(db);
        chunk.forEach(r => {
          // Priorité : sélecteur global > colonne du fichier > null (Non attribué)
          const resolvedEvangelistId = globalEvangelistId
            ? globalEvangelistId
            : (r.evangelistId || null);

          const ref = doc(collection(db, 'evangelized_souls'));
          batch.set(ref, {
            fullName: r.fullName, nickname: r.nickname, gender: r.gender,
            phone: r.phone, location: r.location,
            evangelizationDate: r.evangelizationDate,
            evangelizationLocation: r.evangelizationLocation,
            notes: r.notes, attendedCommunity: r.attendedCommunity,
            gaveLifeToJesus: r.gaveLifeToJesus, plannedService: r.plannedService,
            prayerTopics: r.prayerTopics, interviewerName: r.interviewerName,
            evangelistId: resolvedEvangelistId,
            createdBy: currentUser.id,
            status: 'active',
            createdAt: now, updatedAt: now,
          });
        });
        await batch.commit();
      }
      toast.success(`${validRows.length} âme(s) évangélisée(s) importée(s) avec succès`);
      onImported?.();
      setOpen(false);
      reset();
    } catch (e) {
      console.error('Batch import error:', e);
      toast.error("Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  // Résumé de l'attribution pour l'aperçu
  const effectiveRows = validRows.map(r => ({
    ...r,
    resolvedId: globalEvangelistId ? globalEvangelistId : r.evangelistId,
    resolvedName: globalEvangelistId
      ? (evangelists.find(e => e.id === globalEvangelistId)?.fullName || '—')
      : (r.evangelistMatchName || null),
  }));

  const assignedCount = effectiveRows.filter(r => r.resolvedId).length;
  const unattributedCount = effectiveRows.filter(r => !r.resolvedId).length;

  return (
    <>
      <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button type="button" onClick={() => inputRef.current?.click()}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-[#F2B636] hover:bg-[#F2B636]/90 rounded-md"
        title="Importer depuis un fichier Excel">
        <Upload className="w-4 h-4 mr-1.5" />
        Importer Excel
      </button>

      <Modal isOpen={open} onClose={handleClose} title="Import Excel — Aperçu">
        <div className="p-6 space-y-4">
          {parsing ? (
            <div className="flex items-center justify-center gap-2 text-gray-600 py-8">
              <Loader2 className="w-5 h-5 animate-spin" /> Lecture du fichier...
            </div>
          ) : (
            <>
              {/* Résumé */}
              <div className="flex flex-wrap gap-2 text-sm items-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> {checkingDuplicates ? '…' : validRows.length} à importer
                </span>
                {invalidRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                    <AlertTriangle className="w-4 h-4" /> {invalidRows.length} erreur(s)
                  </span>
                )}
                {dbDuplicateRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
                    <Copy className="w-4 h-4" /> {dbDuplicateRows.length} déjà existant(s) dans l'appli
                  </span>
                )}
                {fileDuplicateRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-medium">
                    <Copy className="w-4 h-4" /> {fileDuplicateRows.length} doublon(s) dans le fichier
                  </span>
                )}
                {unmatchedRows.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                    <AlertTriangle className="w-4 h-4" /> {unmatchedRows.length} évangéliste(s) non trouvé(s)
                  </span>
                )}
                {checkingDuplicates && (
                  <span className="inline-flex items-center gap-1.5 text-gray-500 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Vérification des doublons…
                  </span>
                )}
              </div>

              {/* Sélecteur global (Admin/ADN) */}
              {canChooseEvangelist && (
                <div className="border rounded-md p-3 bg-gray-50 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Forcer l'attribution à un évangéliste <span className="text-gray-400 font-normal">(remplace la colonne du fichier)</span>
                  </label>
                  <EvangelistSelect value={globalEvangelistId} onChange={setGlobalEvangelistId} disabled={importing} />
                  <p className="text-xs text-gray-500">
                    {globalEvangelistId
                      ? 'Toutes les âmes seront assignées à cet évangéliste, quelle que soit la colonne du fichier.'
                      : 'Si vide, la colonne "Évangéliste" du fichier est utilisée. Sans match → "Non attribué".'}
                  </p>
                </div>
              )}

              {/* Aperçu du tableau */}
              {validRows.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 border-b flex justify-between">
                    <span>Aperçu (5 premières lignes valides)</span>
                    <span className="text-gray-500">
                      {assignedCount} attribué(s) · {unattributedCount} non attribué(s)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="px-2 py-1 text-left">Ligne</th>
                          <th className="px-2 py-1 text-left">Nom</th>
                          <th className="px-2 py-1 text-left">Genre</th>
                          <th className="px-2 py-1 text-left">Lieu</th>
                          <th className="px-2 py-1 text-left">Date évang.</th>
                          <th className="px-2 py-1 text-left">Évangéliste</th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectiveRows.slice(0, 5).map(r => (
                          <tr key={r.rowNumber} className="border-t">
                            <td className="px-2 py-1 text-gray-500">{r.rowNumber}</td>
                            <td className="px-2 py-1 font-medium">{r.fullName}</td>
                            <td className="px-2 py-1">{r.gender === 'male' ? 'M' : 'F'}</td>
                            <td className="px-2 py-1">{r.location}</td>
                            <td className="px-2 py-1">{r.evangelizationDate?.toLocaleDateString('fr-FR') || '-'}</td>
                            <td className="px-2 py-1">
                              {r.resolvedName ? (
                                <span className="text-green-700 font-medium">{r.resolvedName}</span>
                              ) : r.evangelistNotFound && !globalEvangelistId ? (
                                <span className="text-amber-700" title={`"${r.evangelistInputRaw}" non trouvé`}>
                                  ⚠ Non trouvé
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                  <UserX className="w-3 h-3" /> Non attribué
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Évangélistes non trouvés */}
              {unmatchedRows.length > 0 && !globalEvangelistId && (
                <div className="border border-amber-200 bg-amber-50 rounded-md p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-semibold text-amber-900 mb-1">Évangélistes non trouvés (seront "Non attribués") :</div>
                  <ul className="space-y-0.5 text-xs text-amber-800">
                    {unmatchedRows.map(r => (
                      <li key={r.rowNumber}>Ligne {r.rowNumber} — <strong>{r.fullName}</strong> : "{r.evangelistInputRaw}" introuvable</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Doublons DB */}
              {dbDuplicateRows.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-md p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-semibold text-amber-900 mb-1">Déjà présents dans l'application (ignorés) :</div>
                  <ul className="space-y-0.5 text-xs text-amber-800">
                    {dbDuplicateRows.map(r => (
                      <li key={r.rowNumber}><strong>Ligne {r.rowNumber}</strong> — {r.fullName} : {r.errors[0]}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Doublons fichier */}
              {fileDuplicateRows.length > 0 && (
                <div className="border border-orange-200 bg-orange-50 rounded-md p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-semibold text-orange-900 mb-1">Doublons dans le fichier (ignorés) :</div>
                  <ul className="space-y-0.5 text-xs text-orange-800">
                    {fileDuplicateRows.map(r => (
                      <li key={r.rowNumber}><strong>Ligne {r.rowNumber}</strong> — {r.fullName}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Lignes invalides */}
              {invalidRows.length > 0 && (
                <div className="border border-red-200 bg-red-50 rounded-md p-3 max-h-32 overflow-y-auto">
                  <div className="text-xs font-semibold text-red-900 mb-1">Lignes avec erreurs (ignorées) :</div>
                  <ul className="space-y-0.5 text-xs text-red-800">
                    {invalidRows.map(r => (
                      <li key={r.rowNumber}><strong>Ligne {r.rowNumber}</strong> : {r.errors.join(' • ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={handleClose} disabled={importing}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-60">
                  Annuler
                </button>
                <button type="button" onClick={handleImport} disabled={importing || checkingDuplicates || validRows.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md disabled:opacity-60">
                  {(importing || checkingDuplicates) && <Loader2 className="w-4 h-4 animate-spin" />}
                  {importing ? 'Import en cours...' : checkingDuplicates ? 'Vérification…' : `Importer ${validRows.length} âme(s)`}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}
