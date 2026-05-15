import { useState } from 'react';
import BatchAttendanceForm from '../components/attendance/BatchAttendanceForm';
import AttendanceList from '../components/attendance/AttendanceList';
import AttendanceStats from '../components/attendance/AttendanceStats';

export default function AttendanceManagement() {
  const [activeTab, setActiveTab] = useState<'list' | 'stats'>('list');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Présences aux cultes</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'list'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Liste
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              activeTab === 'stats'
                ? 'bg-[#00665C] text-white'
                : 'text-gray-700 bg-white border border-gray-300'
            }`}
          >
            Statistiques
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-lg font-semibold text-[#00665C] mb-4">
              Enregistrer les présences
            </h2>
            <BatchAttendanceForm />
          </div>

          <AttendanceList />
        </div>
      ) : (
        <AttendanceStats />
      )}
    </div>
  );
}