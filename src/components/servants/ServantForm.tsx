import { useState, useEffect } from 'react';

import { validatePhoneNumber } from '../../utils/phoneValidation';
import { GenderRadioGroup } from '../../components/ui/GenderRadioGroup';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { useDepartments } from '../../hooks/useDepartments';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { AutomaticSyncService } from '../../services/automaticSync.service';
import { ServantService } from '../../services/servant.service';
import { AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';
import { getProfileDepartmentIds } from '../../types/businessProfile.types';

export default function ServantForm({ onSuccess }: { onSuccess?: () => void }) {
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    gender: 'male' as 'male' | 'female',
    phone: '',
    email: '',
    departmentIds: [] as string[],
    isHead: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; deptNames: string[] } | null>(null);
  const { departments, loading: loadingDepartments } = useDepartments();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Responsable de département ou pasteur assistant (non admin) : formulaire restreint à SES département(s).
  const isDeptLeaderView = !(hasPermission('*') || hasPermission('MANAGE_SERVANTS'))
    && !!(user?.businessProfiles as any[])?.some((p: any) => p?.type === 'department_leader' || p?.type === 'pasteur_assistant');
  const lockedDepartmentIds = isDeptLeaderView
    ? Array.from(new Set(((user?.businessProfiles || []) as any[])
        .filter((p: any) => p.type === 'department_leader' || p.type === 'pasteur_assistant')
        .flatMap((p: any) => getProfileDepartmentIds(p))))
    : [];
  const lockedDepartmentId = lockedDepartmentIds.length === 1 ? lockedDepartmentIds[0] : '';
  const isDeptLocked = lockedDepartmentIds.length === 1;
  const isDeptRestricted = lockedDepartmentIds.length > 1;

  useEffect(() => {
    if (lockedDepartmentId) {
      setFormData(prev =>
        prev.departmentIds.includes(lockedDepartmentId)
          ? prev
          : { ...prev, departmentIds: [lockedDepartmentId] }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lockedDepartmentId]);

  // Avertissement si le téléphone correspond à un B.O.S.S existant (sera fusionné)
  useEffect(() => {
    const phoneValidation = validatePhoneNumber(formData.phone);
    if (!phoneValidation.isValid || !phoneValidation.formattedNumber) {
      setDuplicateWarning(null);
      return;
    }
    let cancelled = false;
    const check = async () => {
      try {
        const { data: snap } = await supabase
          .from('servants')
          .select('full_name, department_ids')
          .eq('church_id', getChurchId())
          .eq('phone', phoneValidation.formattedNumber)
          .eq('status', 'active');
        if (cancelled) return;
        if (!snap || snap.length === 0) { setDuplicateWarning(null); return; }
        const existing = snap[0];
        const existingDepts: string[] = existing.department_ids || [];
        const newDepts = formData.departmentIds.filter(id => !existingDepts.includes(id));
        if (newDepts.length === 0 && existingDepts.length > 0) {
          const deptNames = existingDepts.map(id => departments.find(x => x.id === id)?.name || 'département inconnu');
          setDuplicateWarning({ name: existing.full_name || 'Inconnu', deptNames });
        } else {
          setDuplicateWarning(null);
        }
      } catch (e) {
        if (!cancelled) setDuplicateWarning(null);
      }
    };
    const t = setTimeout(check, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [formData.phone, formData.departmentIds, departments]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Validation
      if (!formData.fullName.trim()) {
        toast.error('Le nom est obligatoire');
        return;
      }

      if (formData.departmentIds.length === 0) {
        toast.error('Sélectionnez au moins un département');
        return;
      }

      const phoneValidation = validatePhoneNumber(formData.phone);
      if (!phoneValidation.isValid) {
        toast.error(phoneValidation.error || 'Numéro de téléphone invalide');
        return;
      }

      await ServantService.createServant({
        fullName: formData.fullName.trim(),
        nickname: formData.nickname.trim() || undefined,
        gender: formData.gender,
        phone: phoneValidation.formattedNumber || '',
        email: formData.email.trim(),
        departmentIds: formData.departmentIds,
        isHead: formData.isHead,
        sourceType: 'manual',
      });

      await AutomaticSyncService.syncOnServantCreation({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        departmentId: formData.departmentIds[0] || '',
        isHead: formData.isHead
      });

      setFormData({
        fullName: '',
        nickname: '',
        gender: 'male',
        phone: '',
        email: '',
        departmentIds: lockedDepartmentId ? [lockedDepartmentId] : [],
        isHead: false
      });

      toast.success('B.O.S.S ajouté avec succès');
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Error adding servant:', error);
      toast.error(error?.message || 'Erreur lors de l\'ajout du B.O.S.S');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom et Prénoms
        </label>
        <input
          type="text"
          required
          placeholder="ex: Jean Kouassi"
          value={formData.fullName}
          onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Surnom (optionnel)
        </label>
        <input
          type="text"
          placeholder="ex: Jean"
          value={formData.nickname}
          onChange={(e) => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <GenderRadioGroup
        value={formData.gender}
        onChange={(gender: 'male' | 'female') => setFormData(prev => ({ ...prev, gender }))}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de téléphone
        </label>
        <PhoneInput
          required
          placeholder="0757000203"
          value={formData.phone}
          onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (optionnel)
        </label>
        <input
          type="email"
          placeholder="ex: jean.kouassi@example.com"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Département(s) *
        </label>
        {loadingDepartments ? (
          <p className="text-sm text-gray-500">Chargement...</p>
        ) : isDeptLocked ? (
          <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded border border-gray-200">
            {departments.find(d => d.id === lockedDepartmentId)?.name || 'Votre département'}
          </p>
        ) : (
          <div className="border border-gray-300 rounded-md max-h-40 overflow-y-auto divide-y divide-gray-100">
            {(isDeptRestricted ? departments.filter(d => lockedDepartmentIds.includes(d.id)) : departments).map(dept => (
              <label key={dept.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={formData.departmentIds.includes(dept.id)}
                  onChange={e => {
                    setFormData(prev => ({
                      ...prev,
                      departmentIds: e.target.checked
                        ? [...prev.departmentIds, dept.id]
                        : prev.departmentIds.filter(id => id !== dept.id),
                    }));
                  }}
                  className="h-4 w-4 text-[#00665C] focus:ring-[#00665C] border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{dept.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isHead"
          checked={formData.isHead}
          onChange={(e) => setFormData(prev => ({ ...prev, isHead: e.target.checked }))}
          className="h-4 w-4 text-[#00665C] focus:ring-[#00665C] border-gray-300 rounded"
        />
        <label htmlFor="isHead" className="ml-2 block text-sm text-gray-900">
          Responsable de département
        </label>
      </div>

      {duplicateWarning && (
        <div className="flex items-start gap-2 p-3 rounded-md border border-amber-300 bg-amber-50 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
          <div>
            Ce numéro est déjà utilisé par <strong>{duplicateWarning.name}</strong> dans {duplicateWarning.deptNames.length > 1 ? 'les départements' : 'le département'}{' '}
            <strong>{duplicateWarning.deptNames.join(', ')}</strong>.
            Vous pouvez quand même l'ajouter dans ce département.
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00665C] disabled:opacity-50"
      >
        {isSubmitting ? 'Ajout en cours...' : 'Ajouter le B.O.S.S'}
      </button>
    </form>
  );
}