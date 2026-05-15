import { useState } from 'react';
import ServiceFamilyForm from '../components/serviceFamilies/ServiceFamilyForm';
import ServiceFamilyList from '../components/serviceFamilies/ServiceFamilyList';
import { Plus } from 'lucide-react';

export default function ServiceFamilyManagement() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Familles de Service</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showForm ? 'Masquer le formulaire' : 'Ajouter une famille'}
        </button>
      </div>
      
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter une famille de service</h2>
          <ServiceFamilyForm />
        </div>
      )}

      <ServiceFamilyList />
    </div>
  );
}