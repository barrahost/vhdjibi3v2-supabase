import React from 'react';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onPresetSelect: (preset: 'today' | 'week' | 'month' | 'year') => void;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onPresetSelect
}: DateRangePickerProps) {
  const handlePresetClick = (preset: 'today' | 'week' | 'month' | 'year') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    switch (preset) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date();
        break;
      case 'week':
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        end = new Date();
        break;
      case 'month':
        start = new Date(now);
        start.setMonth(now.getMonth() - 1);
        end = new Date();
        break;
      case 'year':
        start = new Date(now);
        start.setFullYear(now.getFullYear() - 1);
        end = new Date();
        break;
    }

    onPresetSelect(preset);
    onStartDateChange(start.toISOString().split('T')[0]);
    onEndDateChange(end.toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-4 sm:p-5 rounded-xl border shadow-lg">
      <div className="space-y-4">
        {/* Presets - Responsive grid for mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => handlePresetClick('today')}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors w-full"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => handlePresetClick('week')}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors w-full"
            >
              Cette semaine
            </button>
            <button
              onClick={() => handlePresetClick('month')}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors w-full"
            >
              Ce mois
            </button>
            <button
              onClick={() => handlePresetClick('year')}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors w-full"
            >
              Cette année
            </button>
        </div>
        
        {/* Date inputs - Stack on mobile, side by side on larger screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:sr-only">
              Date de début
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                max={endDate}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-[#00665C] focus:border-[#00665C] shadow-sm transition-all duration-200 hover:border-gray-300"
              />
            </div>
          </div>
          
          <div className="hidden sm:flex items-center justify-center">
            <span className="text-gray-500">à</span>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1 sm:sr-only">
              Date de fin
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                min={startDate}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-[#00665C] focus:border-[#00665C] shadow-sm transition-all duration-200 hover:border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}