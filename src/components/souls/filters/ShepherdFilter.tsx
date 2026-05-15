import ShepherdSelect from '../ShepherdSelect';

interface ShepherdFilterProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

export default function ShepherdFilter({ value, onChange }: ShepherdFilterProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Filtrer par berger(e)
      </label>
      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'unassigned') {
              onChange('unassigned');
            } else if (value === '') {
              onChange(null);
            } else {
              onChange(value);
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C] appearance-none"
        >
          <option value="">Tous les berger(e)s</option>
          <option value="unassigned">Non assigné(e)s</option>
          <ShepherdSelect.Options />
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p className="mt-1 text-sm text-gray-500">
        Sélectionnez un(e) berger(e) pour filtrer les âmes
      </p>
    </div>
  );
}