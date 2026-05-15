import { useState } from 'react';
import { GeneralInfoTab } from './GeneralInfoTab';
import { SpiritualTab } from './SpiritualTab';
import { Soul } from '../../../types/database.types';

interface EditSoulTabsProps {
  data: {
    general: {
      gender: string;
      fullName: string;
      nickname: string;
      phone: string;
      location: string;
      isUndecided: boolean;
      coordinates: { latitude: number; longitude: number; } | null;
      firstVisitDate: string;
      shepherdId: string | undefined;
      status: 'active' | 'inactive';
      photo: File | null;
    };
    spiritual: Soul['spiritualProfile'];
  };
  onChange: (data: any) => void;
  isShepherd?: boolean;
  currentShepherdId?: string | undefined;
  soul?: Soul;
  onSoulUpdate?: () => void;
}

export function EditSoulTabs({ data, onChange, isShepherd, currentShepherdId, soul, onSoulUpdate }: EditSoulTabsProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'spiritual'>('general');

  const handleTabChange = (tab: 'general' | 'spiritual', e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tab);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={(e) => handleTabChange('general', e)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-[#00665C] text-[#00665C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Informations générales
          </button>
          <button
            type="button"
            onClick={(e) => handleTabChange('spiritual', e)}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'spiritual'
                ? 'border-[#00665C] text-[#00665C]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profil spirituel
          </button>
        </nav>
      </div>

      {activeTab === 'general' ? (
        <GeneralInfoTab
          data={data.general}
          onChange={(generalData) => onChange({ ...data, general: generalData })}
          isShepherd={isShepherd}
          currentShepherdId={currentShepherdId}
        />
      ) : (
        <SpiritualTab
          data={data.spiritual}
          onChange={(spiritualData) => onChange({ ...data, spiritual: spiritualData })}
          soul={soul}
          onSoulUpdate={onSoulUpdate}
        />
      )}
    </div>
  );
}