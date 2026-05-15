import { Calendar, Filter } from 'lucide-react';

interface AttendanceFiltersProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  status: string;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  onStatusChange: (status: string) => void;
}

export default function AttendanceFilters({
  dateRange,
  status,
  onDateRangeChange,
  onStatusChange
}: AttendanceFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center">
        <Filter className="w-4 h-4 mr-2" />
        Filtres
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            Date de début
          </label>
          <input
            type="date"
            value={dateRange.startDate}
            onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Calendar className="w-4 h-4 inline-block mr-1" />
            Date de fin
          </label>
          <input
            type="date"
            value={dateRange.endDate}
            onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Statut
          </label>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C]"
          >
            <option value="">Tous</option>
            <option value="present">Présent(e)s</option>
            <option value="absent">Absent(e)s</option>
          </select>
        </div>
      </div>
    </div>
  );
}