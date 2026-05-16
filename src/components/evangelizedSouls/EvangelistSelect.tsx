import { useState, useEffect } from 'react';
import { collection, db, query, where } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';

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
        const q = query(collection(db, 'users'), where('status', '==', 'active'))
        const snapshot = await getDocs(q);
const data = snapshot.docs
          .map(d => {
            const u: any = d.data();
            const profiles: any[] = Array.isArray(u.businessProfiles) ? u.businessProfiles : [];
            const fromRole = u.role === 'evangelist';
            const fromProfiles = profiles.some(
              (p: any) => p?.type === 'evangelist' && p?.isActive !== false
            );
            if (!fromRole && !fromProfiles) return null;
            return { id: d.id, fullName: u.fullName || '' } as EvangelistOption;
          })
          .filter((e): e is EvangelistOption => e !== null && !!e.fullName)
          .sort((a, b) => a.fullName.localeCompare(b.fullName));
        setEvangelists(data);
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
