import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export type DateRange = { startDate: string; endDate: string };

type Preset = {
  label: string;
  key: string;
  getRange: () => DateRange;
};

const presets: Preset[] = [
  {
    label: '7 jours',
    key: '7j',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { startDate: toDateStr(start), endDate: toDateStr(end) };
    },
  },
  {
    label: '30 jours',
    key: '30j',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 29);
      return { startDate: toDateStr(start), endDate: toDateStr(end) };
    },
  },
  {
    label: 'Ce mois',
    key: 'month',
    getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: toDateStr(start), endDate: toDateStr(end) };
    },
  },
  {
    label: '3 mois',
    key: '3m',
    getRange: () => {
      const end = new Date();
      const start = new Date();
      start.setMonth(start.getMonth() - 3);
      return { startDate: toDateStr(start), endDate: toDateStr(end) };
    },
  },
  {
    label: 'Cette année',
    key: 'year',
    getRange: () => {
      const now = new Date();
      return {
        startDate: `${now.getFullYear()}-01-01`,
        endDate: `${now.getFullYear()}-12-31`,
      };
    },
  },
  {
    label: 'Tout',
    key: 'all',
    getRange: () => ({ startDate: '', endDate: '' }),
  },
];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function detectPreset(range: DateRange): string {
  if (range.startDate === '' && range.endDate === '') return 'all';
  for (const p of presets) {
    if (p.key === 'all') continue;
    const computed = p.getRange();
    if (computed.startDate === range.startDate && computed.endDate === range.endDate) {
      return p.key;
    }
  }
  return 'custom';
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  label?: string;
}

export function DateRangePicker({ value, onChange, label }: DateRangePickerProps) {
  const [activeKey, setActiveKey] = useState<string>(() => detectPreset(value));

  useEffect(() => {
    const detected = detectPreset(value);
    setActiveKey(detected);
  }, [value.startDate, value.endDate]);

  const handlePreset = (preset: Preset) => {
    setActiveKey(preset.key);
    onChange(preset.getRange());
  };

  const handleCustom = () => {
    setActiveKey('custom');
  };

  const activeLabel = activeKey === 'custom'
    ? 'Personnalisé'
    : presets.find(p => p.key === activeKey)?.label ?? 'Tout';

  return (
    <div>
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-[#00665C]" />
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#00665C]/10 text-[#00665C]">
            {activeLabel}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => handlePreset(preset)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              activeKey === preset.key
                ? 'bg-[#00665C] text-white border-[#00665C]'
                : 'bg-white text-gray-600 border-gray-300 hover:border-[#00665C] hover:text-[#00665C]'
            }`}
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleCustom}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            activeKey === 'custom'
              ? 'bg-[#00665C] text-white border-[#00665C]'
              : 'bg-white text-gray-600 border-gray-300 hover:border-[#00665C] hover:text-[#00665C]'
          }`}
        >
          Personnalisé
        </button>
      </div>

      {activeKey === 'custom' && (
        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Début</label>
            <input
              type="date"
              value={value.startDate}
              onChange={e => onChange({ ...value, startDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fin</label>
            <input
              type="date"
              value={value.endDate}
              onChange={e => onChange({ ...value, endDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-[#00665C] focus:border-[#00665C]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
