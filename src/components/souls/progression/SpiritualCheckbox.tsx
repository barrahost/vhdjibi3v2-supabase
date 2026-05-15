import { formatDate } from '../../../utils/dateUtils';

interface SpiritualCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  date?: Date;
}

export function SpiritualCheckbox({ label, checked, onChange, date }: SpiritualCheckboxProps) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
        />
      </div>
      <div className="flex-1 min-w-0">
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
        {checked && date && (
          <p className="mt-0.5 text-sm text-gray-500">
            Depuis le {formatDate(date)}
          </p>
        )}
      </div>
    </div>
  );
}