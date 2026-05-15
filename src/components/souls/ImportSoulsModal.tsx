import { useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useServiceFamilies } from '../../hooks/useServiceFamilies';
import {
  parseSoulsFile,
  importSouls,
  downloadTemplate,
  ParsedRow,
} from '../../services/soulImport.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImported?: () => void;
}

type Step = 'select' | 'preview' | 'importing' | 'done';

export default function ImportSoulsModal({ isOpen, onClose, onImported }: Props) {
  const { user } = useAuth();
  const { families } = useServiceFamilies(true);
  const [step, setStep] = useState<Step>('select');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsing, setParsing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  if (!isOpen) return null;

  const valid = rows.filter((r) => r.status === 'valid').length;
  const warning = rows.filter((r) => r.status === 'warning').length;
  const invalid = rows.filter((r) => r.status === 'invalid').length;
  const importable = valid + warning;

  const reset = () => {
    setStep('select');
    setRows([]);
    setProgress({ done: 0, total: 0 });
    setResult(null);
  };

  const handleClose = () => {
    if (step === 'importing') return;
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error('Fichier .xlsx requis.');
      return;
    }
    setParsing(true);
    try {
      const parsed = await parseSoulsFile(file);
      if (parsed.length === 0) {
        toast.error('Aucune ligne trouvée dans le fichier.');
        return;
      }
      setRows(parsed);
      setStep('preview');
    } catch (e: any) {
      toast.error(e?.message || 'Erreur de lecture du fichier.');
    } finally {
      setParsing(false);
    }
  };

  const handleImport = async () => {
    if (!user?.uid) {
      toast.error('Utilisateur non identifié.');
      return;
    }
    setStep('importing');
    setProgress({ done: 0, total: importable });
    try {
      const res = await importSouls(rows, user.uid, (done, total) =>
        setProgress({ done, total })
      );
      setResult(res);
      setStep('done');
      toast.success(`${res.imported} âme(s) importée(s).`);
      onImported?.();
    } catch (e: any) {
      toast.error(e?.message || 'Erreur pendant l\'import.');
      setStep('preview');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00665C]" />
            <h2 className="text-base sm:text-lg font-semibold text-[#00665C]">
              Importer des âmes depuis Excel
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'importing'}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-4 sm:px-6 py-3 border-b bg-gray-50 text-xs sm:text-sm">
          <div className="flex items-center gap-2 sm:gap-4 text-gray-600">
            <span className={step === 'select' ? 'font-semibold text-[#00665C]' : ''}>
              1. Fichier
            </span>
            <span>›</span>
            <span className={step === 'preview' ? 'font-semibold text-[#00665C]' : ''}>
              2. Aperçu
            </span>
            <span>›</span>
            <span
              className={
                step === 'importing' || step === 'done'
                  ? 'font-semibold text-[#00665C]'
                  : ''
              }
            >
              3. Import
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          {step === 'select' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-sm text-blue-800 p-3 rounded">
                <p className="font-medium mb-1">Format attendu</p>
                <p>
                  Feuille « Import Âmes », en-têtes en ligne 3, données dès la ligne 4.
                  Colonnes : Date 1ère visite, Nom complet, Surnom, Genre, Téléphone,
                  Lieu, Famille, Provenance, Âme indécise, Remarques.
                </p>
              </div>

              <button
                onClick={() => downloadTemplate(families.map((f) => f.name))}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded-md"
              >
                <Download className="w-4 h-4" />
                Télécharger le modèle
              </button>

              <label className="block">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#00665C] cursor-pointer transition-colors">
                  {parsing ? (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span>Analyse du fichier en cours…</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-600">
                      <Upload className="w-8 h-8" />
                      <span className="font-medium">Cliquez pour sélectionner un fichier .xlsx</span>
                      <span className="text-xs text-gray-500">ou glissez-déposez ici</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  disabled={parsing}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div className="p-2 rounded bg-gray-50 border">
                  <div className="text-gray-600">Total</div>
                  <div className="text-lg font-semibold">{rows.length}</div>
                </div>
                <div className="p-2 rounded bg-green-50 border border-green-200">
                  <div className="text-green-700">Valides</div>
                  <div className="text-lg font-semibold text-green-700">{valid}</div>
                </div>
                <div className="p-2 rounded bg-amber-50 border border-amber-200">
                  <div className="text-amber-700">Avertissements</div>
                  <div className="text-lg font-semibold text-amber-700">{warning}</div>
                </div>
                <div className="p-2 rounded bg-red-50 border border-red-200">
                  <div className="text-red-700">Invalides</div>
                  <div className="text-lg font-semibold text-red-700">{invalid}</div>
                </div>
              </div>

              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="px-2 py-2 text-left">Statut</th>
                      <th className="px-2 py-2 text-left">Ligne</th>
                      <th className="px-2 py-2 text-left">Nom</th>
                      <th className="px-2 py-2 text-left">Genre</th>
                      <th className="px-2 py-2 text-left">Téléphone</th>
                      <th className="px-2 py-2 text-left">Lieu</th>
                      <th className="px-2 py-2 text-left">Date</th>
                      <th className="px-2 py-2 text-left">Messages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr
                        key={r.rowNumber}
                        className={
                          r.status === 'invalid'
                            ? 'bg-red-50'
                            : r.status === 'warning'
                            ? 'bg-amber-50'
                            : ''
                        }
                      >
                        <td className="px-2 py-1.5">
                          {r.status === 'valid' && (
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                          )}
                          {r.status === 'warning' && (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          )}
                          {r.status === 'invalid' && (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                        <td className="px-2 py-1.5 text-gray-500">{r.rowNumber}</td>
                        <td className="px-2 py-1.5">{r.raw.fullName || '—'}</td>
                        <td className="px-2 py-1.5">{r.raw.gender || '—'}</td>
                        <td className="px-2 py-1.5">{r.raw.phone || '—'}</td>
                        <td className="px-2 py-1.5">{r.raw.location || '—'}</td>
                        <td className="px-2 py-1.5">{r.raw.firstVisitDate || '—'}</td>
                        <td className="px-2 py-1.5 text-xs">
                          {[...r.errors, ...r.warnings].join(' • ') || ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="py-8 space-y-4 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-[#00665C] mx-auto" />
              <p className="text-gray-700">
                Import en cours… {progress.done} / {progress.total}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
                <div
                  className="bg-[#00665C] h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      progress.total ? (progress.done / progress.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {step === 'done' && result && (
            <div className="py-8 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
              <p className="text-lg font-semibold text-gray-800">
                Import terminé
              </p>
              <p className="text-gray-600">
                {result.imported} âme(s) importée(s) avec succès,{' '}
                {result.skipped} ignorée(s).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t bg-gray-50 flex flex-col sm:flex-row gap-2 sm:justify-end">
          {step === 'preview' && (
            <>
              <button
                onClick={reset}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Choisir un autre fichier
              </button>
              <button
                onClick={handleImport}
                disabled={importable === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-[#00665C] rounded-md hover:bg-[#00665C]/90 disabled:opacity-50"
              >
                Importer {importable} âme(s)
              </button>
            </>
          )}
          {(step === 'select' || step === 'done') && (
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {step === 'done' ? 'Fermer' : 'Annuler'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
