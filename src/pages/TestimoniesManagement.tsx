import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  Search, Trash2, Sparkles, FileSpreadsheet, Phone, MessageCircle, UserCircle2, Mic, Megaphone, Copy, Check, Download, QrCode, ChevronDown, ChevronUp, Share2, EyeOff,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import {
  TestimonyService, Testimony, TESTIMONY_CATEGORIES, TESTIMONY_STATUSES, TESTIMONY_STATUS_LABELS, TestimonyStatus, formatDuration,
} from '../services/testimony.service';
import { CustomPagination } from '../components/ui/CustomPagination';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { Modal } from '../components/ui/Modal';
import { telHref, whatsappHref } from '../utils/phoneValidation';
import { exportTestimonies } from '../utils/export/testimonies';
import { plain } from '../lib/baptism';

const ITEMS_PER_PAGE = 12;

const STATUS_COLORS: Record<TestimonyStatus, string> = {
  nouveau: 'bg-gray-100 text-gray-700',
  a_partager: 'bg-amber-100 text-amber-800',
  partage: 'bg-green-100 text-green-700',
  archive: 'bg-slate-100 text-slate-500',
};

const dateFr = (d: Date, month: 'short' | 'long' = 'short') => d.toLocaleDateString('fr-FR', { day: 'numeric', month, year: 'numeric' });

/** Le lien public à diffuser (WhatsApp, annonce au culte, QR code à afficher). */
function ShareLinkCard() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const link = `${window.location.origin}/temoignage`;
  const message = `Partage ton témoignage : raconte ce que Dieu a fait pour toi, par écrit ou en audio (anonyme si tu le souhaites). ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success('Lien copié');
    } catch {
      toast.error('Copie impossible : sélectionnez le lien à la main');
    }
  };
  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'qr-code-temoignages.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <Share2 className="w-5 h-5 text-[#00665C] flex-shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-gray-900">Recueillir des témoignages</span>
          <span className="block text-xs text-gray-500 truncate">Lien, message WhatsApp et QR code à afficher</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 grid gap-4 sm:grid-cols-[auto,1fr] items-start">
          <div className="mx-auto p-3 bg-white rounded-lg border border-gray-100">
            <QRCodeCanvas ref={canvasRef} value={link} size={180} level="H" marginSize={2} />
          </div>
          <div className="space-y-2.5 min-w-0">
            <p className="text-xs text-gray-600 font-mono break-all bg-gray-50 border rounded-md px-3 py-2">{link}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button type="button" onClick={copy} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#00665C] rounded-md">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copié' : 'Copier le lien'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 border border-emerald-600 rounded-md"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
              <button type="button" onClick={downloadQr} className="flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-[#00665C] border border-[#00665C] rounded-md">
                <Download className="w-4 h-4" /> QR code
              </button>
            </div>
            <p className="text-xs text-gray-500 flex items-start gap-1.5">
              <QrCode className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> Imprimez le QR code ou projetez-le au culte : les fidèles le scannent et déposent leur
              témoignage depuis leur téléphone, sans compte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TestimoniesManagement() {
  const { confirm, confirmModalProps } = useConfirmModal();
  const [items, setItems] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | TestimonyStatus>('all');
  const [onlyAudio, setOnlyAudio] = useState(false);
  const [onlyShareable, setOnlyShareable] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Testimony | null>(null);

  const load = useCallback(async () => {
    try {
      setItems(await TestimonyService.getAll());
      setFailed(false);
    } catch (error) {
      console.error('Error loading testimonies:', error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('testimonies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'testimonies', filter: `church_id=eq.${getChurchId()}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => setCurrentPage(1), [searchTerm, categoryFilter, statusFilter, onlyAudio, onlyShareable]);

  const filtered = useMemo(() => {
    const words = plain(searchTerm).split(/\s+/).filter(Boolean);
    return items
      .filter((t) => categoryFilter === 'all' || t.category === categoryFilter)
      .filter((t) => statusFilter === 'all' || t.status === statusFilter)
      .filter((t) => !onlyAudio || !!t.audioUrl)
      .filter((t) => !onlyShareable || t.shareConsent)
      .filter((t) => {
        if (words.length === 0) return true;
        const text = plain(`${t.content ?? ''} ${t.fullName ?? ''}`);
        return words.every((w) => text.includes(w));
      });
  }, [items, searchTerm, categoryFilter, statusFilter, onlyAudio, onlyShareable]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const audioCount = items.filter((t) => t.audioUrl).length;

  const handleDelete = async (t: Testimony) => {
    if (!(await confirm('Supprimer ce témoignage ? Son enregistrement audio sera aussi supprimé.'))) return;
    try {
      await TestimonyService.remove(t);
      setItems((prev) => prev.filter((r) => r.id !== t.id));
      setSelected((prev) => (prev?.id === t.id ? null : prev));
      toast.success('Témoignage supprimé');
    } catch (error: any) {
      toast.error(`Le témoignage n'a pas été supprimé.${error?.message ? ` (${error.message})` : ''}`);
    }
  };

  const handleStatusChange = async (id: string, status: TestimonyStatus) => {
    try {
      await TestimonyService.updateStatus(id, status);
      setItems((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev));
      toast.success('Statut mis à jour');
    } catch (error: any) {
      toast.error(`Le statut n'a pas été modifié.${error?.message ? ` (${error.message})` : ''}`);
    }
  };

  const chip = (active: boolean, dark = false) =>
    `flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
      active ? (dark ? 'bg-gray-800 text-white' : 'bg-[#00665C] text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-gray-500">Chargement des témoignages...</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <ConfirmModal {...confirmModalProps} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Témoignages</h1>
          <p className="text-sm text-gray-400">
            {items.length} témoignage{items.length !== 1 ? 's' : ''} · dont {audioCount} en audio
          </p>
        </div>
        <button
          onClick={() => (filtered.length === 0 ? toast.error('Aucun témoignage à exporter') : exportTestimonies(filtered))}
          className="self-start flex items-center px-3 py-1.5 text-xs sm:text-sm font-medium sm:px-4 sm:py-2 text-[#00665C] border border-[#00665C] rounded-md hover:bg-[#00665C]/10"
        >
          <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel ({filtered.length})
        </button>
      </div>

      <ShareLinkCard />

      {failed && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-red-800">
          <span className="flex-1">
            Impossible de charger les témoignages. Si c'est la première utilisation, le script <code>supabase_testimonies.sql</code> doit être
            exécuté dans Supabase.
          </span>
          <button onClick={() => load()} className="px-3 py-1.5 text-sm font-medium text-white bg-[#00665C] rounded-md">
            Réessayer
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setCategoryFilter('all')} className={chip(categoryFilter === 'all')}>
          Tous ({items.length})
        </button>
        {TESTIMONY_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={chip(categoryFilter === cat)}>
            {cat} ({items.filter((t) => t.category === cat).length})
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatusFilter('all')} className={chip(statusFilter === 'all', true)}>
          Tous statuts
        </button>
        {TESTIMONY_STATUSES.map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)} className={chip(statusFilter === s, true)}>
            {TESTIMONY_STATUS_LABELS[s]} ({items.filter((t) => t.status === s).length})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={onlyAudio} onChange={(e) => setOnlyAudio(e.target.checked)} className="rounded border-gray-300 text-[#00665C]" />
          Avec audio
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={onlyShareable} onChange={(e) => setOnlyShareable(e.target.checked)} className="rounded border-gray-300 text-[#00665C]" />
          Partage autorisé
        </label>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher dans les témoignages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{items.length === 0 ? 'Aucun témoignage pour l’instant : partagez le lien ci-dessus.' : 'Aucun témoignage ne correspond aux filtres.'}</p>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2" data-testid="testimony-list">
          {paginated.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setSelected(t)}
                className="w-full h-full text-left bg-white rounded-lg border shadow-sm p-4 hover:border-[#00665C]/40 transition-colors"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#00665C]/10 text-[#00665C]">{t.category}</span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${STATUS_COLORS[t.status]}`}>{TESTIMONY_STATUS_LABELS[t.status]}</span>
                  {t.audioUrl && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">
                      <Mic className="w-3 h-3" /> Audio {formatDuration(t.audioDuration)}
                    </span>
                  )}
                  {t.shareConsent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
                      <Megaphone className="w-3 h-3" /> Partage OK
                    </span>
                  )}
                  {t.publicAnonymous && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      <EyeOff className="w-3 h-3" /> Anonyme en public
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-2 line-clamp-3 break-words">
                  {t.content || <span className="italic text-gray-400">Témoignage en audio uniquement</span>}
                </p>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5 flex-wrap">
                  <span>{dateFr(t.submittedAt)}</span>
                  {t.fullName ? (
                    <span className="flex items-center gap-1 text-[#00665C]">
                      <UserCircle2 className="w-3.5 h-3.5" />
                      {t.fullName}
                    </span>
                  ) : (
                    <span>· Anonyme</span>
                  )}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} />
      )}

      {selected && (
        <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Témoignage">
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">{selected.category}</span>
              <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{TESTIMONY_STATUS_LABELS[selected.status]}</span>
            </div>

            {selected.audioUrl && (
              <div className="space-y-1.5">
                <audio controls preload="metadata" src={selected.audioUrl} className="w-full" />
                <a href={selected.audioUrl} target="_blank" rel="noopener noreferrer" download className="inline-flex items-center gap-1 text-xs text-[#00665C] hover:underline">
                  <Download className="w-3.5 h-3.5" /> Télécharger l'audio {selected.audioDuration ? `(${formatDuration(selected.audioDuration)})` : ''}
                </a>
              </div>
            )}
            {selected.content && <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed break-words">{selected.content}</p>}

            <p className={`text-xs flex items-center gap-1.5 ${selected.shareConsent ? 'text-amber-700' : 'text-gray-500'}`}>
              <Megaphone className="w-3.5 h-3.5" />
              {selected.shareConsent
                ? `Accepte que son témoignage soit partagé${selected.fullName && !selected.publicAnonymous ? '' : ' (sans nom)'}.`
                : "N'a pas donné son accord pour un partage public : réservé aux pasteurs."}
            </p>
            {selected.publicAnonymous && (
              <p className="text-xs font-semibold text-slate-700 bg-slate-100 rounded-md px-3 py-2 flex items-start gap-1.5" data-testid="public-anonymous-notice">
                <EyeOff className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                A demandé l'anonymat en public : ne jamais citer son nom au culte ni dans une publication.
              </p>
            )}
            <p className="text-xs text-gray-400">Déposé le {dateFr(selected.submittedAt, 'long')}</p>

            {selected.fullName ? (
              <div className="p-3 bg-gray-50 rounded-xl space-y-2">
                <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                  <UserCircle2 className="w-4 h-4 text-[#00665C]" />
                  {selected.fullName}
                </p>
                {selected.phone && (
                  <div className="flex gap-2">
                    <a href={telHref(selected.phone) ?? undefined} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#00665C] bg-white border border-[#00665C] rounded-md">
                      <Phone className="w-3.5 h-3.5" /> Appeler
                    </a>
                    <a
                      href={whatsappHref(selected.phone) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white border border-emerald-600 rounded-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Témoignage anonyme : pas de contact fourni.</p>
            )}

            <div>
              <p className="text-xs font-medium text-gray-500 mb-1.5">Changer le statut</p>
              <div className="flex flex-wrap gap-1.5">
                {TESTIMONY_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(selected.id, s)}
                    disabled={selected.status === s}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-colors disabled:cursor-default ${
                      selected.status === s ? 'border-[#00665C] bg-[#00665C]/5 text-[#00665C]' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {TESTIMONY_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => handleDelete(selected)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
