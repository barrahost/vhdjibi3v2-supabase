import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateForInput } from '../../utils/dateUtils';
import { CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function BatchAttendanceForm() {
  const { user } = useAuth();
  const [shepherdId, setShepherdId] = useState<string | null>(null);
  const [date, setDate] = useState(formatDateForInput(new Date()));
  const [souls, setSouls] = useState<Array<{ id: string; fullName: string; present: boolean; selected: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const loadShepherdAndSouls = async () => {
      if (!user) return;
      try {
        const localUser = JSON.parse(localStorage.getItem('user') || '{}');
        const currentUserId = localUser.id;
        if (!currentUserId) { toast.error('Session expirée'); setLoading(false); return; }

        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('*')
          .eq('id', currentUserId)
          .single();

        if (userErr || !userData) { toast.error('Utilisateur non trouvé'); setLoading(false); return; }

        const isAdmin = userData.role === 'admin' || userData.role === 'super_admin';
        const hasShepherdProfile = isAdmin || (userData.business_profiles || userData.businessProfiles)?.some(
          (p: any) => p.type === 'shepherd' && p.isActive
        ) || userData.role === 'shepherd' || userData.role === 'intern';

        if (!hasShepherdProfile) { toast.error('Accès non autorisé - profil berger requis'); setLoading(false); return; }

        setShepherdId(currentUserId);

        // L'admin voit toutes les âmes actives ; un berger ne voit que les siennes
        const soulsQuery = supabase
          .from('souls')
          .select('id, full_name')
          .eq('status', 'active');
        if (!isAdmin) soulsQuery.eq('shepherd_id', currentUserId);

        const { data: soulsData, error: soulsErr } = await soulsQuery;

        if (soulsErr) throw soulsErr;

        setSouls((soulsData ?? []).map((row: any) => ({
          id: row.id,
          fullName: row.full_name || '',
          present: false,
          selected: false,
        })));
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };
    loadShepherdAndSouls();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shepherdId) { toast.error('Berger non identifié'); return; }
    const selectedSouls = souls.filter(s => s.selected);
    if (selectedSouls.length === 0) { toast.error('Veuillez sélectionner au moins une âme'); return; }

    try {
      const selectedDate = new Date(date).toISOString();
      await Promise.all(selectedSouls.map(soul =>
        supabase.from('attendances').insert({
          id: crypto.randomUUID(),
          soul_id: soul.id,
          shepherd_id: shepherdId,
          date: selectedDate,
          present: soul.present,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      ));
      setSouls(souls.map(s => ({ ...s, present: false, selected: false })));
      setSelectAll(false);
      setDate(formatDateForInput(new Date()));
      toast.success('Présences enregistrées avec succès');
    } catch (error) {
      console.error('Error saving attendances:', error);
      toast.error("Erreur lors de l'enregistrement des présences");
    }
  };

  const togglePresence = (id: string) => setSouls(souls.map(s => s.id === id ? { ...s, present: !s.present } : s));
  const toggleSelection = (id: string) => {
    const updated = souls.map(s => s.id === id ? { ...s, selected: !s.selected } : s);
    setSouls(updated);
    setSelectAll(updated.every(s => s.selected));
  };
  const handleSelectAll = () => { const v = !selectAll; setSelectAll(v); setSouls(souls.map(s => ({ ...s, selected: v }))); };
  const handleMarkSelectedAs = (present: boolean) => setSouls(souls.map(s => s.selected ? { ...s, present } : s));

  if (loading) return <div className="text-center py-4 text-gray-500">Chargement des âmes...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Date du culte</label>
        <input type="date" required value={date} onChange={e => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]" />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Liste des âmes</h3>
          <button type="button" onClick={handleSelectAll} className="flex items-center text-sm text-gray-600 hover:text-gray-900">
            {selectAll ? <CheckSquare className="w-4 h-4 mr-2" /> : <Square className="w-4 h-4 mr-2" />}
            {selectAll ? 'Tout désélectionner' : 'Tout sélectionner'}
          </button>
        </div>
        {souls.length === 0 ? <p className="text-gray-500">Aucune âme assignée</p> : (
          <>
            <div className="flex justify-end space-x-3 mb-4">
              <button type="button" onClick={() => handleMarkSelectedAs(false)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200">Marquer comme absents</button>
              <button type="button" onClick={() => handleMarkSelectedAs(true)}
                className="px-3 py-1 text-sm text-[#00665C] hover:bg-[#00665C]/10 rounded-md border border-[#00665C]/20">Marquer comme présents</button>
            </div>
            <div className="space-y-2">
              {souls.map(soul => (
                <div key={soul.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <button type="button" onClick={() => toggleSelection(soul.id)} className="text-gray-400 hover:text-gray-600">
                      {soul.selected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                    <p className="font-medium text-gray-900">{soul.fullName}</p>
                  </div>
                  <div className="flex-1" />
                  <div className="flex items-center space-x-4">
                    <label className="inline-flex items-center">
                      <input type="radio" checked={!soul.present} onChange={() => togglePresence(soul.id)}
                        className="form-radio text-red-600 focus:ring-red-600" />
                      <span className="ml-2">Absent(e)</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input type="radio" checked={soul.present} onChange={() => togglePresence(soul.id)}
                        className="form-radio text-[#00665C] focus:ring-[#00665C]" />
                      <span className="ml-2">Présent(e)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <button type="submit" disabled={souls.length === 0}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 disabled:opacity-50">
        Enregistrer les présences
      </button>
    </form>
  );
}
