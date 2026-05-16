import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Upload, AlertTriangle, CheckCircle2, FileSpreadsheet, X, Loader2, Copy } from 'lucide-react';
import { validatePhoneNumber } from '../../utils/phoneValidation';
import { BusinessProfileType } from '../../types/businessProfile.types';
import { ServantService } from '../../services/servant.service';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

/* ─── Types ─────────────────────────────────────────────── */
type RowStatus = 'valid' | 'error' | 'db_duplicate' | 'file_duplicate';

interface ParsedRow {
  rowIndex: number;
  fullName: string;
  phone: string;          // formatted
  phoneRaw: string;
  email: string;
  profileRaw: string;
  profileType: BusinessProfileType | null;
  nickname: string;
  errors: string[];
  status: RowStatus;
}

/* ─── Constantes ─────────────────────────────────────────── */
const PROFILE_MAP: Record<string, BusinessProfileType> = {
  admin:              'admin',
  administrateur:     'admin',
  adn:                'adn',
  shepherd:           'shepherd',
  berger:             'shepherd',
  bergere:            'shepherd',
  'berger(e)':        'shepherd',
  department_leader:  'department_leader',
  'resp. département':'department_leader',
  'responsable de département': 'department_leader',
  'responsable département':    'department_leader',
  family_leader:      'family_leader',
  'resp. famille':    'family_leader',
  'responsable de famille': 'family_leader',
  evangelist:         'evangelist',
  'évangéliste':      'evangelist',
  evangeliste:        'evangelist',
};

const PROFILE_LABELS: Record<BusinessProfileType, string> = {
  admin:              'Administrateur',
  adn:                'ADN',
  shepherd:           'Berger(e)',
  department_leader:  'Resp. Département',
  family_leader:      'Resp. Famille',
  evangelist:         'Évangéliste',
};

const DEFAULT_PWD: Record<BusinessProfileType, string> = {
  admin: '@123456', adn: '@123456', shepherd: '@123456',
  department_leader: '@123456', family_leader: '@123456', evangelist: '@123456',
};

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/* ─── Composant ──────────────────────────────────────────── */
interface ImportUsersFromExcelProps {
  onSuccess?: () => void;
}

export default function ImportUsersFromExcel({ onSuccess }: ImportUsersFromExcelProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ imported: number; skipped: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── Vérification des doublons Firestore après parsing ── */
  useEffect(() => {
    if (rows.length === 0) return;
    // Seulement si des lignes ont un téléphone valide (pas d'erreur de format)
    const phonesToCheck = rows
      .filter(r => !r.errors.some(e => e.includes('Téléphone')))
      .map(r => r.phone);
    if (phonesToCheck.length === 0) return;

    const checkDB = async () => {
      setCheckingDuplicates(true);
      try {
        const snap = await supabase.from('users').select('*');
        const existingPhones = new Set(snap.docs.map(d => d.data().phone as string));

        setRows(prev => prev.map(row => {
          if (row.status === 'error') return row; // garder les erreurs de format
          if (row.status === 'file_duplicate') return row; // garder les doublons intra-fichier
          if (existingPhones.has(row.phone)) {
            return {
              ...row,
              status: 'db_duplicate' as RowStatus,
              errors: ['Téléphone déjà utilisé dans l\'application'],
            };
          }
          return row;
        }));
      } catch (err) {
        console.error('Erreur vérification doublons:', err);
      } finally {
        setCheckingDuplicates(false);
      }
    };

    checkDB();
  }, [rows.length]); // déclenché une seule fois après le parsing initial

  /* ── Parse fichier ── */
  const parseFile = (file: File) => {
    setFileName(file.name);
    setDone(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const dataRows = raw.slice(1).filter(r => r.some(c => String(c).trim()));

        // Détecter les doublons intra-fichier (même téléphone dans le fichier)
        const phoneCount: Record<string, number> = {};
        dataRows.forEach(row => {
          const phoneRaw = String(row[1] ?? '').trim();
          const pv = validatePhoneNumber(phoneRaw);
          if (pv.isValid && pv.formattedNumber) {
            phoneCount[pv.formattedNumber] = (phoneCount[pv.formattedNumber] || 0) + 1;
          }
        });

        const parsed: ParsedRow[] = dataRows.map((row, i) => {
          const fullName   = String(row[0] ?? '').trim();
          const phoneRaw   = String(row[1] ?? '').trim();
          const email      = String(row[2] ?? '').trim();
          const profileRaw = String(row[3] ?? '').trim();
          const nickname   = String(row[4] ?? '').trim();
          const errors: string[] = [];

          if (!fullName) errors.push('Nom manquant');

          const phoneVal = validatePhoneNumber(phoneRaw);
          if (!phoneVal.isValid) errors.push(phoneVal.error || 'Téléphone invalide');

          const profileType = PROFILE_MAP[normalize(profileRaw)] ?? null;
          if (!profileRaw) errors.push('Profil manquant');
          else if (!profileType) errors.push(`Profil inconnu : "${profileRaw}"`);

          const formattedPhone = phoneVal.isValid ? (phoneVal.formattedNumber ?? phoneRaw) : phoneRaw;

          // Doublon intra-fichier (même téléphone apparaît plusieurs fois)
          const isFileDuplicate =
            phoneVal.isValid &&
            phoneVal.formattedNumber &&
            (phoneCount[phoneVal.formattedNumber] ?? 0) > 1;

          let status: RowStatus = 'valid';
          if (errors.length > 0) {
            status = 'error';
          } else if (isFileDuplicate) {
            status = 'file_duplicate';
            errors.push('Numéro en doublon dans le fichier');
          }

          return {
            rowIndex: i + 2,
            fullName,
            phone: formattedPhone,
            phoneRaw,
            email,
            profileRaw,
            profileType,
            nickname,
            errors,
            status,
          };
        });

        setRows(parsed);
      } catch {
        toast.error('Impossible de lire le fichier Excel');
      }
    };
    reader.readAsBinaryString(file);
  };

  /* ── Décomptes ── */
  const validRows        = rows.filter(r => r.status === 'valid');
  const errorRows        = rows.filter(r => r.status === 'error');
  const dbDuplicateRows  = rows.filter(r => r.status === 'db_duplicate');
  const fileDuplicateRows= rows.filter(r => r.status === 'file_duplicate');
  const skippedRows      = [...dbDuplicateRows, ...fileDuplicateRows, ...errorRows];

  /* ── Import ── */
  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    let imported = 0;
    let skipped  = 0;

    try {
      // Re-vérification finale avant écriture
      const snap = await supabase.from('users').select('*');
      const existingPhones = new Set(snap.docs.map(d => d.data().phone as string));

      for (const row of validRows) {
        if (existingPhones.has(row.phone)) { skipped++; continue; }

        const profileType = row.profileType!;
        const uid = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const docRef = const { error: _insertErr } = await supabase.from('users').insert({
          uid,
          fullName: row.fullName,
          nickname: row.nickname || null,
          email: row.email || null,
          phone: row.phone,
          role: profileType,
          businessProfiles: [{ type: profileType, isActive: true, isPrimary: true }],
          password: DEFAULT_PWD[profileType],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        if (profileType === 'shepherd' || profileType === 'department_leader') {
          try {
            await ServantService.createServant({
              fullName: row.fullName,
              nickname: row.nickname || undefined,
              gender: 'male',
              phone: row.phone,
              email: row.email || '',
              departmentId: '',
              isHead: false,
              isShepherd: true,
              shepherdId: docRef.id,
            });
          } catch { /* non bloquant */ }
        }

        imported++;
      }

      setDone({ imported, skipped });
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'import");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setRows([]);
    setFileName('');
    setDone(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  /* ── Rendu badge statut ── */
  const StatusBadge = ({ row }: { row: ParsedRow }) => {
    if (row.status === 'valid') {
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
    if (row.status === 'db_duplicate') {
      return (
        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5 whitespace-nowrap">
          <Copy className="w-3 h-3" /> Déjà existant
        </span>
      );
    }
    if (row.status === 'file_duplicate') {
      return (
        <span className="flex items-center gap-1 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded px-1.5 py-0.5 whitespace-nowrap">
          <Copy className="w-3 h-3" /> Doublon fichier
        </span>
      );
    }
    return (
      <div className="flex flex-col gap-0.5">
        {row.errors.map((e, i) => (
          <span key={i} className="text-red-600 flex items-center gap-1 text-xs whitespace-nowrap">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {e}
          </span>
        ))}
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center px-3 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
      >
        <FileSpreadsheet className="w-4 h-4 mr-1.5" />
        Importer Excel
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#00665C]">
              <FileSpreadsheet className="w-5 h-5" />
              Importer des utilisateurs depuis Excel
            </DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <CheckCircle2 className="w-14 h-14 text-green-500" />
              <p className="text-lg font-semibold text-gray-800">Import terminé</p>
              <div className="text-sm text-gray-600 text-center space-y-1">
                <p><strong>{done.imported}</strong> utilisateur{done.imported > 1 ? 's' : ''} importé{done.imported > 1 ? 's' : ''} avec succès</p>
                {done.skipped > 0 && (
                  <p className="text-amber-600"><strong>{done.skipped}</strong> ligne{done.skipped > 1 ? 's' : ''} ignorée{done.skipped > 1 ? 's' : ''} (doublon détecté à l'import)</p>
                )}
              </div>
              <button onClick={handleClose} className="mt-2 px-6 py-2 bg-[#00665C] text-white rounded-md hover:bg-[#00665C]/90 text-sm font-medium">
                Fermer
              </button>
            </div>
          ) : rows.length === 0 ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-10 cursor-pointer hover:border-[#00665C] hover:bg-[#00665C]/5 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Cliquer pour sélectionner un fichier Excel</p>
              <p className="text-xs text-gray-400 mt-1">.xlsx ou .xls</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden"
                onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
            </label>
          ) : (
            <>
              {/* En-tête fichier */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-gray-600">
                  Fichier : <strong>{fileName}</strong> — {rows.length} ligne{rows.length > 1 ? 's' : ''}
                </p>
                <button onClick={() => { setRows([]); setFileName(''); if (fileRef.current) fileRef.current.value = ''; }}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Changer de fichier
                </button>
              </div>

              {/* Compteurs */}
              <div className="flex gap-2 flex-wrap text-sm items-center">
                <span className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {checkingDuplicates ? '…' : validRows.length} à importer
                </span>
                {errorRows.length > 0 && (
                  <span className="flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> {errorRows.length} erreur{errorRows.length > 1 ? 's' : ''}
                  </span>
                )}
                {dbDuplicateRows.length > 0 && (
                  <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                    <Copy className="w-3.5 h-3.5" /> {dbDuplicateRows.length} déjà existant{dbDuplicateRows.length > 1 ? 's' : ''} dans l'appli
                  </span>
                )}
                {fileDuplicateRows.length > 0 && (
                  <span className="flex items-center gap-1 text-orange-700 bg-orange-50 border border-orange-200 rounded px-2 py-1">
                    <Copy className="w-3.5 h-3.5" /> {fileDuplicateRows.length} doublon{fileDuplicateRows.length > 1 ? 's' : ''} dans le fichier
                  </span>
                )}
                {checkingDuplicates && (
                  <span className="flex items-center gap-1 text-gray-500 text-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Vérification des doublons…
                  </span>
                )}
              </div>

              {/* Tableau prévisualisation */}
              <div className="flex-1 overflow-auto border rounded-md">
                <table className="min-w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['#', 'Nom et Prénoms', 'Téléphone', 'Email', 'Profil', 'Surnom', 'Statut'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rows.map((row) => {
                      const rowBg =
                        row.status === 'valid'          ? 'bg-white hover:bg-gray-50' :
                        row.status === 'db_duplicate'   ? 'bg-amber-50' :
                        row.status === 'file_duplicate' ? 'bg-orange-50' :
                                                          'bg-red-50';
                      return (
                        <tr key={row.rowIndex} className={rowBg}>
                          <td className="px-3 py-2 text-gray-400">{row.rowIndex}</td>
                          <td className="px-3 py-2 font-medium text-gray-900">
                            {row.fullName || <span className="text-red-400 italic">vide</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.phone}</td>
                          <td className="px-3 py-2 text-gray-500">{row.email || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-2">
                            {row.profileType ? (
                              <span className="bg-[#00665C]/10 text-[#00665C] px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                                {PROFILE_LABELS[row.profileType]}
                              </span>
                            ) : (
                              <span className="text-red-500 italic">{row.profileRaw || 'vide'}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500">{row.nickname || <span className="text-gray-300">—</span>}</td>
                          <td className="px-3 py-2"><StatusBadge row={row} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {skippedRows.length > 0 && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Les lignes en orange/rouge seront ignorées. Seules les <strong>{validRows.length}</strong> lignes vertes seront importées.
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Annuler
                </button>
                <button
                  onClick={handleImport}
                  disabled={validRows.length === 0 || importing || checkingDuplicates}
                  className="flex-1 px-4 py-2 bg-[#00665C] text-white rounded-md text-sm font-medium hover:bg-[#00665C]/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Import en cours…</>
                  ) : checkingDuplicates ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Vérification…</>
                  ) : (
                    <><FileSpreadsheet className="w-4 h-4" /> Importer {validRows.length} utilisateur{validRows.length > 1 ? 's' : ''}</>
                  )}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
