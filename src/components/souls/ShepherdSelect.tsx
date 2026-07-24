import { useState, useEffect } from 'react';
import { ShepherdOption } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface ShepherdSelectProps {
  value: string | undefined;
  onChange: (shepherdId: string | undefined) => void;
  disabled?: boolean;
  /** Si fourni, ne montre que les bergers de cette famille de service
   *  (si la famille a des bergers assignés — sinon tous les bergers). */
  serviceFamilyId?: string;
}

function Options({ serviceFamilyId }: { serviceFamilyId?: string }) {
  const [shepherds, setShepherds] = useState<ShepherdOption[]>([]);

  useEffect(() => {
    const loadShepherds = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, uid, full_name, role, business_profiles')
          .eq('church_id', getChurchId())
          .eq('status', 'active');

        if (error) throw error;

        let list = (data ?? [])
          .filter((r: any) => {
            // Include if role is shepherd/intern OR has shepherd profile in business_profiles
            const roleMatch = ['shepherd', 'intern'].includes(r.role);
            const profileMatch = Array.isArray(r.business_profiles) &&
              r.business_profiles.some((p: any) => p.type === 'shepherd');
            return roleMatch || profileMatch;
          })
          .map((r: any) => ({
            id: r.id,
            fullName: r.full_name || '',
            role: r.role,
          } as ShepherdOption))
          .filter((s: any) => !!s.fullName);

        if (serviceFamilyId) {
          const { data: famRow } = await supabase
            .from('service_families')
            .select('shepherd_ids')
            .eq('id', serviceFamilyId)
            .single();
          const allowedIds: string[] = famRow?.shepherd_ids || [];
          if (allowedIds.length > 0) {
            list = list.filter((s: any) => allowedIds.includes(s.id));
          }
        }

        list.sort((a: any, b: any) => a.fullName.localeCompare(b.fullName));
        setShepherds(list);
      } catch (error) {
        console.error('Error loading shepherds:', error);
      }
    };
    loadShepherds();
  }, [serviceFamilyId]);

  return (
    <>
      {shepherds.map(shepherd => (
        <option key={shepherd.id} value={shepherd.id}>
          {shepherd.fullName} {shepherd.role === 'intern' ? '(Stagiaire)' : ''}
        </option>
      ))}
    </>
  );
}

export default function ShepherdSelect({ value, onChange, disabled = false, serviceFamilyId }: ShepherdSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue === '' ? undefined : selectedValue);
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
    >
      <option value="">Non assigné(e)</option>
      <Options serviceFamilyId={serviceFamilyId} />
    </select>
  );
}

ShepherdSelect.Options = Options;
