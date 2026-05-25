import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { Building2, Plus, Edit2, Trash2, Globe, Phone, Mail, MapPin, CheckCircle, XCircle, Puzzle } from 'lucide-react';
import toast from 'react-hot-toast';
import { MODULE_DEFINITIONS, DEFAULT_MODULES, ChurchModules } from '../lib/churchModules';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Church {
  id: string;
  name: string;
  slug: string;
  modules?: ChurchModules;
  logo_url: string | null;
  primary_color: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  short_name: '',
  copyright_name: '',
  primary_color: '#00665C',
  address: '',
  phone: '',
  email: '',
  status: 'active' as 'active' | 'inactive',
  modules: { ...DEFAULT_MODULES } as ChurchModules,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ChurchesManagement() {
  const { userRole } = useAuth();
  const { confirm, confirmModalProps } = useConfirmModal();
  const [churches, setChurches] = useState<Church[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChurch, setEditingChurch] = useState<Church | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [modulesOpen, setModulesOpen] = useState(false);

  // Only super_admin can access this page
  if (userRole !== 'super_admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Accès réservé au super administrateur.</p>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  useEffect(() => { fetchChurches(); }, []);

  const fetchChurches = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('churches')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setChurches(data || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des églises');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  const openAdd = () => {
    setEditingChurch(null);
    setForm(EMPTY_FORM);
    setModulesOpen(false);
    setShowForm(true);
  };

  const openEdit = (c: Church) => {
    setEditingChurch(c);
    setForm({
      name: c.name,
      slug: c.slug,
      short_name: (c as any).short_name || '',
      copyright_name: (c as any).copyright_name || '',
      primary_color: c.primary_color || '#00665C',
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
      status: c.status,
      modules: { ...DEFAULT_MODULES, ...(c.modules || {}) },
    });
    setModulesOpen(false);
    setShowForm(true);
  };

  const handleSlugChange = (value: string) => {
    // Auto-format slug: lowercase, no spaces, no special chars
    const slug = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    setForm(prev => ({ ...prev, slug }));
  };

  // -------------------------------------------------------------------------
  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Le nom et le slug sont obligatoires');
      return;
    }
    setSaving(true);
    try {
      if (editingChurch) {
        // Update
        const { error } = await supabase
          .from('churches')
          .update({
            name: form.name.trim(),
            slug: form.slug.trim(),
            short_name: (form as any).short_name?.trim() || null,
            copyright_name: (form as any).copyright_name?.trim() || null,
            primary_color: form.primary_color,
            address: form.address.trim() || null,
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            status: form.status,
            modules: form.modules,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingChurch.id);
        if (error) throw error;
        toast.success('Église mise à jour');
      } else {
        // Insert
        const id = form.slug.trim(); // use slug as id for readability
        const { error } = await supabase.from('churches').insert({
          id,
          name: form.name.trim(),
          slug: form.slug.trim(),
          short_name: (form as any).short_name?.trim() || null,
          copyright_name: (form as any).copyright_name?.trim() || null,
          primary_color: form.primary_color,
          address: form.address.trim() || null,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          status: form.status,
          modules: form.modules,
        });
        if (error) throw error;
        // Configurer automatiquement le DNS + custom domain Cloudflare
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('setup-church-domain', {
            body: { slug: form.slug.trim() },
          });
          if (fnError || !fnData?.success) {
            console.warn('DNS auto-setup partiel:', fnData?.results || fnError);
            toast.success('Église créée ✓ — Configuration DNS en cours (vérifiez Cloudflare si besoin)');
          } else {
            toast.success(`Église créée ✓ — ${fnData.subdomain} configuré automatiquement`);
          }
        } catch {
          toast.success('Église créée ✓ — Configuration DNS manuelle requise');
        }
      }
      await fetchChurches();
      setShowForm(false);
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.error('Ce slug est déjà utilisé par une autre église');
      } else {
        toast.error(err?.message || 'Erreur lors de la sauvegarde');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (church: Church) => {
    if (church.slug === 'bergerie') {
      toast.error("L'église AGC ne peut pas être supprimée");
      return;
    }
    const ok = await confirm(
      `Supprimer l'église "${church.name}" (${church.slug}) ? Toutes ses données seront dissociées.`
    );
    if (!ok) return;
    try {
      // Nettoyer DNS + domaine Cloudflare avant suppression
      try {
        await supabase.functions.invoke('setup-church-domain', {
          body: { slug: church.slug, action: 'delete' },
        });
      } catch (e) {
        console.warn('DNS cleanup warning:', e);
      }
      const { error } = await supabase.from('churches').delete().eq('id', church.id);
      if (error) throw error;
      setChurches(prev => prev.filter(c => c.id !== church.id));
      toast.success('Église supprimée');
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression');
    }
  };

  // -------------------------------------------------------------------------
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 className="w-7 h-7 text-[#00665C]" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Gestion des Églises</h1>
            <p className="text-sm text-gray-500">{churches.length} église{churches.length > 1 ? 's' : ''} enregistrée{churches.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#00665C] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#005249] transition"
        >
          <Plus className="w-4 h-4" />
          Nouvelle église
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00665C]" />
        </div>
      ) : (
        <div className="grid gap-4">
          {churches.map(church => (
            <div key={church.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Color dot */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: church.primary_color || '#00665C' }}
                  >
                    {church.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-gray-900">{church.name}</h2>
                      {church.status === 'active' ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </div>
                    {/* URL */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <Globe className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-sm text-[#00665C] font-mono">{church.slug}.evdh.org</span>
                    </div>
                    {/* Contact info */}
                    <div className="flex flex-wrap gap-3 mt-1.5">
                      {church.address && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />{church.address}
                        </span>
                      )}
                      {church.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />{church.phone}
                        </span>
                      )}
                      {church.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />{church.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => openEdit(church)}
                    className="p-2 text-gray-400 hover:text-[#00665C] hover:bg-gray-100 rounded-lg transition"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {church.slug !== 'bergerie' && (
                    <button
                      onClick={() => handleDelete(church)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl my-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">
              {editingChurch ? 'Modifier l\'église' : 'Nouvelle église'}
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de l'église <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => {
                    setForm(prev => ({ ...prev, name: e.target.value }));
                    if (!editingChurch) handleSlugChange(e.target.value);
                  }}
                  placeholder="ex: Assemblée Grâce Confondante"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (sous-domaine) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={form.slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    disabled={editingChurch?.slug === 'agc'}
                    placeholder="ex: grace-paris"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#00665C] disabled:bg-gray-50"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">.evdh.org</span>
                </div>
                {form.slug && (
                  <p className="mt-1 text-xs text-[#00665C]">→ {form.slug}.evdh.org</p>
                )}
              </div>

              {/* Color */}
              {/* Nom court (page de login) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom court <span className="text-gray-400 font-normal">(affiché sur la page de connexion)</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: AGC Bergerie"
                  value={(form as any).short_name || ''}
                  onChange={e => setForm(prev => ({ ...prev, short_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                />
              </div>

              {/* Copyright */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom copyright <span className="text-gray-400 font-normal">(pied de page)</span>
                </label>
                <input
                  type="text"
                  placeholder="ex: Vases d'Honneur Assemblée Grâce Confondante"
                  value={(form as any).copyright_name || ''}
                  onChange={e => setForm(prev => ({ ...prev, copyright_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={e => setForm(prev => ({ ...prev, primary_color: e.target.value }))}
                    className="h-9 w-16 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <span className="text-sm font-mono text-gray-600">{form.primary_color}</span>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="ex: 15 rue de la Paix, Paris"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                />
              </div>

              {/* Phone + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+33 6 00 00 00 00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contact@eglise.org"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                <select
                  value={form.status}
                  onChange={e => setForm(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00665C]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Modules */}
            <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setModulesOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition text-sm font-medium text-gray-700"
              >
                <span className="flex items-center gap-2">
                  <Puzzle className="w-4 h-4 text-[#00665C]" />
                  Modules activés
                  <span className="text-xs text-gray-400 font-normal">
                    ({Object.values(form.modules).filter(Boolean).length}/{Object.keys(form.modules).length} actifs)
                  </span>
                </span>
                <span className="text-gray-400">{modulesOpen ? '▲' : '▼'}</span>
              </button>
              {modulesOpen && (
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['pastoral', 'administration', 'communication', 'statistiques'] as const).map(cat => {
                    const catModules = MODULE_DEFINITIONS.filter(m => m.category === cat);
                    return (
                      <div key={cat}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </p>
                        <div className="space-y-2">
                          {catModules.map(mod => (
                            <label key={mod.key} className="flex items-start gap-3 cursor-pointer group">
                              <div className="relative flex-shrink-0 mt-0.5">
                                <input
                                  type="checkbox"
                                  checked={form.modules[mod.key] !== false}
                                  onChange={e => setForm(prev => ({
                                    ...prev,
                                    modules: { ...prev.modules, [mod.key]: e.target.checked }
                                  }))}
                                  className="sr-only"
                                />
                                <div className={`w-9 h-5 rounded-full transition-colors ${form.modules[mod.key] !== false ? 'bg-[#00665C]' : 'bg-gray-200'}`}>
                                  <div className={`w-3.5 h-3.5 bg-white rounded-full shadow transform transition-transform mt-0.75 ${form.modules[mod.key] !== false ? 'translate-x-4' : 'translate-x-0.5'}`} style={{marginTop:'3px', marginLeft: form.modules[mod.key] !== false ? '18px' : '2px'}} />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{mod.icon} {mod.label}</p>
                                <p className="text-xs text-gray-400">{mod.description}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-[#00665C] text-white rounded-lg hover:bg-[#005249] disabled:opacity-50 transition font-medium"
              >
                {saving ? 'Enregistrement...' : editingChurch ? 'Mettre à jour' : 'Créer l\'église'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal {...confirmModalProps} />
    </div>
  );
}
