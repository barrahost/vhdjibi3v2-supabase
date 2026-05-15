import { useState } from 'react';
import { Plus } from 'lucide-react';
import SMSTemplateForm from '../components/sms/templates/SMSTemplateForm.tsx';
import SMSTemplateList from '../components/sms/templates/SMSTemplateList.tsx';
import { CategoryManagement } from '../components/sms/templates/CategoryManagement';
import { Tabs } from '../components/ui/tabs';

export default function SMSTemplatesManagement() {
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'categories'>('templates');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des modèles SMS</h1>
        {activeTab === 'templates' && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-[#00665C] hover:bg-[#00665C]/90 rounded-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Masquer le formulaire' : 'Ajouter un modèle'}
          </button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('templates')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-[#00665C] text-[#00665C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Modèles SMS
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-[#00665C] text-[#00665C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Catégories
          </button>
        </nav>
      </div>
      
      {activeTab === 'templates' && showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-[#00665C] mb-4">Ajouter un modèle</h2>
          <SMSTemplateForm />
        </div>
      )}

      {activeTab === 'templates' && <SMSTemplateList />}
      {activeTab === 'categories' && <CategoryManagement />}
    </div>
  );
}