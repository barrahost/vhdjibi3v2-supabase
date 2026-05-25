import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface EvangelistOption {
  id: string;
  fullName: string;
}

interface EvangelistSelectProps {
  value: string | undefined;
  onChange: (evangelistId: string | undefined) => void;
  disabled?: boolean;
}

function Options() {
  const [evangelists, setEvangelists] = useState<EvangelistOption[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, role')
          .eq('church_id', getChurchId())
          .eq('status', 'active')
          .eq('role', 'evangelist');

        if (error) throw error;

        const list = (data ?? [])
          .map((r: any) => ({ id: r.id, fullName: r.full_name || '' }))
          .filter((e: any) => !!e.fullName)
          .sort((a: any, b: any) => a.fullName.localeCompare(b.fullName));

        setEvangelists(list);
      } catch (error) {
        console.error('Error loading evangelists:', error);
      }
    };
    load();
  }, []);

  return (
    <>
      {evangelists.map(e => (
        <option key={e.id} value={e.id}>{e.fullName}</option>
      ))}
    </>
  );
}

export default function EvangelistSelect({ value, onChange, disabled = false }: EvangelistSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value;
    onChange(v === '' ? undefined : v);
  };

  return (
    <select
      value={value || ''}
      onChange={handleChange}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
    >
      <option value="">Non assigné(e)</option>
      <Options />
    </select>
  );
}

EvangelistSelect.Options = Options;
