import { UserCircle2 } from 'lucide-react';

interface GenderRadioGroupProps {
  value: string;
  onChange: (value: 'male' | 'female') => void;
  disabled?: boolean;
}

export function GenderRadioGroup({ value, onChange, disabled = false }: GenderRadioGroupProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Genre
      </label>
      <div className="flex space-x-4">
        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
          value === 'male'
            ? 'bg-blue-50 border-blue-200'
            : 'hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name="gender"
            value="male"
            checked={value === 'male'}
            onChange={(e) => onChange(e.target.value as 'male' | 'female')}
            className="sr-only"
            disabled={disabled}
          />
          <UserCircle2 className={`w-5 h-5 ${value === 'male' ? 'text-blue-500' : 'text-gray-400'}`} />
          <span className={`ml-2 ${value === 'male' ? 'text-blue-700' : 'text-gray-700'}`}>
            Homme
          </span>
        </label>

        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
          value === 'female'
            ? 'bg-pink-50 border-pink-200'
            : 'hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input
            type="radio"
            name="gender"
            value="female"
            checked={value === 'female'}
            onChange={(e) => onChange(e.target.value as 'male' | 'female')}
            className="sr-only"
            disabled={disabled}
          />
          <UserCircle2 className={`w-5 h-5 ${value === 'female' ? 'text-pink-500' : 'text-gray-400'}`} />
          <span className={`ml-2 ${value === 'female' ? 'text-pink-700' : 'text-gray-700'}`}>
            Femme
          </span>
        </label>
      </div>
    </div>
  );
}