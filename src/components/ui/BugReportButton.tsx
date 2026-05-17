import { useState } from 'react';
import { Bug, X, Send, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function BugReportButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
  });

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('bug_reports').insert({
        id: crypto.randomUUID(),
        title: form.title.trim(),
        description: form.description.trim(),
        page_url: window.location.pathname,
        user_id: user.id,
        user_name: user.fullName || user.email || 'Utilisateur',
        priority: form.priority,
        status: 'open',
      });
      if (error) throw error;
      toast.success('Bug signalé avec succès. Merci !');
      setForm({ title: '', description: '', priority: 'medium' });
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Erreur lors de l\'envoi du signalement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(true)}
        title="Signaler un bug"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded-full shadow-lg transition-all duration-200 group"
      >
        <Bug className="w-4 h-4" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
          Signaler un bug
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Bug className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">Signaler un bug</h2>
                  <p className="text-xs text-gray-500">Page : {window.location.pathname}</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="ex: Le bouton supprimer ne réagit pas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez ce qui s'est passé, ce que vous attendiez…"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorité</label>
                <div className="relative">
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                  >
                    <option value="low">🟢 Faible — mineur, contournement possible</option>
                    <option value="medium">🟡 Moyen — gênant mais pas bloquant</option>
                    <option value="high">🔴 Urgent — bloquant, impossible de continuer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !form.title.trim() || !form.description.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {submitting ? 'Envoi…' : <><Send className="w-4 h-4" /> Envoyer</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
