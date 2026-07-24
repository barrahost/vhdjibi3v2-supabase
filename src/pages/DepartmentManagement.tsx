import { useState } from 'react';
import DepartmentForm from '../components/departments/DepartmentForm';
import DepartmentList from '../components/departments/DepartmentList';
import { Plus } from 'lucide-react';

export default function DepartmentManagement() {
  const [showForm, setShowForm] = useState(false);
  const [reloadSignal, setReloadSignal] = useState(0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Gestion des Départements</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-2.5 py-1.5 text-xs sm:text-sm sm:px-4 sm:py-2 font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
        >
          <Plus className="w-3.5 h-3.5 mr-1 sm:w-4 sm:h-4 sm:mr-2" />
          {showForm ? 'Masquer le formulaire' : 'Ajouter un département'}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter un département</h2>
          <DepartmentForm onSuccess={() => { setReloadSignal(s => s + 1); setShowForm(false); }} />
        </div>
      )}

      <DepartmentList reloadSignal={reloadSignal} />
    </div>
  );
}