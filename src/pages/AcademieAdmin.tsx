import { useEffect, useState } from 'react';
import { AcademieService } from '../services/academie.service';
import type { AcademieClass, AcademieEnrollment } from '../types/academie.types';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import toast from 'react-hot-toast';
import { Plus, UserPlus, X, Search } from 'lucide-react';

export default function AcademieAdmin() {
  const [classes, setClasses] = useState<AcademieClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [enrollments, setEnrollments] = useState<AcademieEnrollment[]>([]);
  const [users, setUsers] = useState<{ id: string; fullName: string; phone: string }[]>([]);
  const [search, setSearch] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [cls, allUsers] = await Promise.all([
      AcademieService.getClasses(),
      supabase.from('users').select('id, full_name, phone').eq('church_id', getChurchId()).eq('status', 'active').order('full_name'),
    ]);
    setClasses(cls);
    setUsers((allUsers.data || []).map((u: any) => ({ id: u.id, fullName: u.full_name || '', phone: u.phone || '' })));
    if (cls.length > 0 && !selectedClassId) setSelectedClassId(cls[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    AcademieService.getEnrollmentsByClass(selectedClassId).then(setEnrollments);
  }, [selectedClassId]);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return;
    try {
      await AcademieService.createClass({ name: newClassName.trim() });
      setNewClassName('');
      toast.success('Classe créée');
      load();
    } catch {
      toast.error('Erreur');
    }
  };

  const enrolledIds = new Set(enrollments.filter(e => e.status === 'active').map(e => e.userId));

  const handleToggleEnroll = async (userId: string) => {
    try {
      if (enrolledIds.has(userId)) {
        await AcademieService.unenroll(userId, selectedClassId);
      } else {
        await AcademieService.enroll(userId, selectedClassId);
      }
      const fresh = await AcademieService.getEnrollmentsByClass(selectedClassId);
      setEnrollments(fresh);
    } catch {
      toast.error('Erreur');
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search)
  );

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* Classes */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Classes de l'Académie</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {classes.map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedClassId(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border ${
                selectedClassId === c.id ? 'bg-brand-700 text-white border-brand-700' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nouvelle classe (ex: Classe 4)"
            value={newClassName}
            onChange={e => setNewClassName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1 max-w-xs"
          />
          <button
            type="button"
            onClick={handleCreateClass}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-700 text-white text-sm rounded-md hover:bg-brand-800"
          >
            <Plus className="w-4 h-4" /> Créer
          </button>
        </div>
      </div>

      {/* Inscriptions */}
      {selectedClassId && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-gray-900">
              Inscriptions — {classes.find(c => c.id === selectedClassId)?.name}
            </h2>
            <span className="text-xs text-gray-500">{enrolledIds.size} inscrit(s)</span>
          </div>
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y">
            {filteredUsers.map(u => {
              const enrolled = enrolledIds.has(u.id);
              return (
                <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-500">{u.phone}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleEnroll(u.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md flex-shrink-0 ${
                      enrolled ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-brand-700 text-white'
                    }`}
                  >
                    {enrolled ? <><X className="w-3.5 h-3.5" /> Retirer</> : <><UserPlus className="w-3.5 h-3.5" /> Inscrire</>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
