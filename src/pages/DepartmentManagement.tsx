import { useState } from 'react';
import DepartmentForm from '../components/departments/DepartmentForm';
import DepartmentList from '../components/departments/DepartmentList';
import { Plus } from 'lucide-react';

export default function DepartmentManagement() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Départements</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Masquer le formulaire' : 'Ajouter un département'}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter un département</h2>
          <DepartmentForm />
        </div>
      )}

      <DepartmentList />
    </div>
  );
}