import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ShepherdOption } from '../../types/database.types';

interface ShepherdSelectProps {
  value: string | undefined;
  onChange: (shepherdId: string | undefined) => void;
  disabled?: boolean;
}

// Composant pour les options uniquement
function Options() {
  const [shepherds, setShepherds] = useState<ShepherdOption[]>([]);

  useEffect(() => {
    const loadShepherds = async () => {
      try {
        // Récupérer tous les utilisateurs actifs puis filtrer côté client
        // pour combiner le champ legacy `role` ET le système `businessProfiles`.
        const q = query(
          collection(db, 'users'),
          where('status', '==', 'active')
        );

        const snapshot = await getDocs(q);
        const shepherdsData = snapshot.docs
          .map(doc => {
            const data: any = doc.data();
            const profiles: any[] = Array.isArray(data.businessProfiles) ? data.businessProfiles : [];
            const fromRole = data.role === 'shepherd' || data.role === 'intern';
            const fromProfiles = profiles.some(
              (p: any) => (p?.type === 'shepherd' || p?.type === 'intern') && p?.isActive !== false
            );
            if (!fromRole && !fromProfiles) return null;
            const isIntern =
              data.role === 'intern' ||
              profiles.some((p: any) => p?.type === 'intern' && p?.isActive !== false);
            return {
              id: doc.id,
              fullName: data.fullName || '',
              role: isIntern ? 'intern' : 'shepherd',
            } as ShepherdOption;
          })
          .filter((s): s is ShepherdOption => s !== null && !!s.fullName)
          .sort((a, b) => a.fullName.localeCompare(b.fullName));

        setShepherds(shepherdsData);
      } catch (error) {
        console.error('Error loading shepherds:', error);
      }
    };

    loadShepherds();
  }, []);

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

export default function ShepherdSelect({ value, onChange, disabled = false }: ShepherdSelectProps) {
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
      <Options />
    </select>
  );
}

ShepherdSelect.Options = Options;