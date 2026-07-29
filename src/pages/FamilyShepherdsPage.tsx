import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FamilyLeaderService } from '../services/familyLeader.service';
import { Users, Heart, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FamilyShepherdsPage() {
  const { user } = useAuth();
  const [shepherds, setShepherds] = useState<{ id: string; fullName: string; soulCount: number }[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const userId = user?.id || user?.uid;
      if (!userId) return;
      try {
        const fam = await FamilyLeaderService.getFamilyByLeaderId(userId);
        if (!fam) { setLoading(false); return; }
        setFamilyName(fam.name);
        const sh = await FamilyLeaderService.getShepherdsOfFamily(fam.shepherdIds || [], fam.id);
        setShepherds(sh);
      } catch {
        toast.error('Erreur lors du chargement des bergers');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  if (!familyName) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
        <p className="text-amber-800">Aucune famille assignée. Contactez un administrateur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Bergers — Famille {familyName}</h1>

      {shepherds.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
          <Users className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p>Aucun berger n'est encore rattaché à cette famille.</p>
          <p className="text-sm mt-1">Les bergers apparaissent dès qu'un membre de la famille leur est assigné.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <span className="font-semibold text-gray-900">{shepherds.length} berger{shepherds.length > 1 ? 's' : ''}</span>
          </div>
          <div className="divide-y">
            {shepherds
              .sort((a, b) => b.soulCount - a.soulCount)
              .map(sh => (
                <div key={sh.id} className="px-4 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#00665C]/10 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-[#00665C]" />
                    </div>
                    <span className="font-medium text-gray-900">{sh.fullName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Heart className="w-4 h-4 text-[#00665C]" />
                    <span>{sh.soulCount} membre{sh.soulCount > 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
