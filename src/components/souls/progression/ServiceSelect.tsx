interface ServiceSelectProps {
  label: string;
  value?: string;
  onChange: (familyName: string | undefined) => void;
  options: Array<{ id: string; name: string }>;
}

export function ServiceSelect({ label, value, onChange, options }: ServiceSelectProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
      >
        <option value="">Non assigné(e)</option>
        {options.map(option => (
          <option key={option.id} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}