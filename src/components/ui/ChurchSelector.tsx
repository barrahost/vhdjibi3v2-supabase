import { Building2, ChevronDown } from 'lucide-react';
import { useChurch } from '../../contexts/ChurchContext';

/**
 * Sélecteur d'église visible uniquement sur bergerie-adm.evdh.org.
 * Permet au super admin de filtrer toutes les données par église.
 */
export function ChurchSelector() {
  const { isSuperAdminDomain, allChurches, selectedChurchId, setSelectedChurchId } = useChurch();

  if (!isSuperAdminDomain || allChurches.length === 0) return null;

  const selectedChurch = allChurches.find(c => c.id === selectedChurchId);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-gray-400">
        <Building2 className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wide hidden sm:inline">
          Église
        </span>
      </div>
      <div className="relative">
        <select
          value={selectedChurchId}
          onChange={e => setSelectedChurchId(e.target.value)}
          className="
            appearance-none
            pl-3 pr-8 py-1.5
            text-sm font-medium
            bg-gray-900 text-white
            border border-gray-700
            rounded-lg
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-indigo-500
            hover:border-gray-500
            transition-colors
          "
        >
          {allChurches.map(church => (
            <option key={church.id} value={church.id}>
              {church.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
      </div>
      {selectedChurch && (
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: selectedChurch.primaryColor }}
          title={selectedChurch.name}
        />
      )}
    </div>
  );
}
