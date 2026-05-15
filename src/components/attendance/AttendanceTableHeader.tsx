import { ArrowUpDown } from 'lucide-react';

interface AttendanceTableHeaderProps {
  sortConfig: {
    field: 'fullName' | 'date' | 'present';
    direction: 'asc' | 'desc';
  };
  onSort: (field: 'fullName' | 'date' | 'present') => void;
}

export function AttendanceTableHeader({ sortConfig, onSort }: AttendanceTableHeaderProps) {
  return (
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => onSort('fullName')}
            className="group flex items-center space-x-1"
          >
            <span>Nom et Prénoms</span>
            <ArrowUpDown className={`w-4 h-4 transition-colors ${
              sortConfig.field === 'fullName' ? 'text-[#00665C]' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
          </button>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => onSort('date')}
            className="group flex items-center space-x-1"
          >
            <span>Date</span>
            <ArrowUpDown className={`w-4 h-4 transition-colors ${
              sortConfig.field === 'date' ? 'text-[#00665C]' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
          </button>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <button
            onClick={() => onSort('present')}
            className="group flex items-center space-x-1"
          >
            <span>Statut</span>
            <ArrowUpDown className={`w-4 h-4 transition-colors ${
              sortConfig.field === 'present' ? 'text-[#00665C]' : 'text-gray-400 group-hover:text-gray-600'
            }`} />
          </button>
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Notes
        </th>
        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
          Actions
        </th>
      </tr>
    </thead>
  );
}