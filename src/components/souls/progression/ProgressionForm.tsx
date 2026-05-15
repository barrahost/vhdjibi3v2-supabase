import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SpiritualProfile, Soul } from '../../../types/database.types';
import { formatDate } from '../../../utils/dateUtils';
import { SpiritualCheckbox } from './SpiritualCheckbox';
import { ServiceSelect } from './ServiceSelect';
import ServantPromotionForm from './ServantPromotionForm';
import { usePermissions } from '../../../hooks/usePermissions';
import { Separator } from '../../ui/separator';
import toast from 'react-hot-toast';

interface ProgressionFormProps {
  value: SpiritualProfile;
  onChange: (profile: SpiritualProfile) => void;
  soul?: Soul; // Ajout de l'âme pour la promotion
  onSoulUpdate?: () => void;
}

export function ProgressionForm({ value, onChange, soul, onSoulUpdate }: ProgressionFormProps) {
  const [departments, setDepartments] = useState<{id: string; name: string}[]>([]);
  const [serviceFamilies, setServiceFamilies] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermissions();

  const canPromoteToServant = hasPermission('PROMOTE_SOUL_TO_SERVANT');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Charger les départements actifs
        const deptQuery = query(collection(db, 'departments'), orderBy('order', 'asc'));
        const deptSnapshot = await getDocs(deptQuery);
        setDepartments(deptSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })));

        // Charger les familles de service actives
        const familiesQuery = query(
          collection(db, 'serviceFamilies'),
          where('status', '==', 'active'),
          orderBy('order', 'asc')
        );
        const familiesSnapshot = await getDocs(familiesQuery);
        setServiceFamilies(familiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        })));

      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleChange = (field: keyof SpiritualProfile, newValue: any) => {
    const updatedProfile = { ...value };

    // Define mapping for date fields
    const dateFieldMap: Record<string, keyof SpiritualProfile> = {
      isBornAgain: 'bornAgainDate',
      isBaptized: 'baptismDate',
      isEnrolledInAcademy: 'academyEnrollmentDate',
      isEnrolledInLifeBearers: 'lifeBearersEnrollmentDate'
    };

    if (field === 'departments') {
      // S'assurer que departments existe
      if (!updatedProfile.departments) {
        updatedProfile.departments = [];
      }

      // Gérer l'ajout de département
      const departmentName = newValue.name;
      const exists = updatedProfile.departments.some(d => d.name === departmentName);
      
      if (!exists) {
        updatedProfile.departments.push({
          name: departmentName,
          startDate: new Date()
        });
      }
    } else if (field === 'servantFamily') {
      updatedProfile.servantFamily = newValue || undefined;
    } else if (typeof newValue === 'boolean' && (
      field === 'isBornAgain' || 
      field === 'isBaptized' || 
      field === 'isEnrolledInAcademy' || 
      field === 'isEnrolledInLifeBearers'
    )) {
      updatedProfile[field] = newValue;
      
      // Gérer les dates associées
      const dateField = dateFieldMap[field];
      if (newValue) {
        (updatedProfile as any)[dateField] = new Date();
      } else {
        (updatedProfile as any)[dateField] = undefined;
      }
    }

    onChange(updatedProfile);
  };

  const removeDepartment = (departmentName: string) => {
    if (!value.departments) return;

    const updatedProfile = {
      ...value,
      departments: value.departments.filter(d => d.name !== departmentName)
    };

    onChange(updatedProfile);
  };

  if (loading) {
    return <div className="text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Étapes spirituelles</h3>
          <SpiritualCheckbox
            label="Né(e) de nouveau"
            checked={value.isBornAgain}
            onChange={(checked) => handleChange('isBornAgain', checked)}
            date={value.bornAgainDate}
          />

          <SpiritualCheckbox
            label="Baptisé(e)"
            checked={value.isBaptized}
            onChange={(checked) => handleChange('isBaptized', checked)}
            date={value.baptismDate}
          />

          <SpiritualCheckbox
            label="Inscrit(e) à l'Académie VDH"
            checked={value.isEnrolledInAcademy}
            onChange={(checked) => handleChange('isEnrolledInAcademy', checked)}
            date={value.academyEnrollmentDate}
          />

          <SpiritualCheckbox
            label="Inscrit(e) à l'École PDV"
            checked={value.isEnrolledInLifeBearers}
            onChange={(checked) => handleChange('isEnrolledInLifeBearers', checked)}
            date={value.lifeBearersEnrollmentDate}
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Service</h3>
          
          <ServiceSelect
            label="Famille de service"
            value={value.servantFamily}
            onChange={(familyName) => handleChange('servantFamily', familyName)}
            options={serviceFamilies}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Départements
            </label>
            {/* Liste des départements actuels */}
            <div className="space-y-2 mb-4">
              {value.departments && value.departments.length > 0 ? (
                value.departments.map(dept => (
                  <div 
                    key={dept.name} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{dept.name}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        (depuis le {formatDate(dept.startDate)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDepartment(dept.name)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Retirer
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">
                  Aucun département assigné
                </p>
              )}
            </div>

            {/* Sélecteur pour ajouter un département */}
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  handleChange('departments', { name: e.target.value });
                  e.target.value = '';
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#00665C] focus:border-[#00665C] text-sm"
            >
              <option value="">Ajouter un département</option>
              {departments
                .filter(dept => !(value.departments || []).some(d => d.name === dept.name))
                .map(dept => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))
              }
            </select>
          </div>
        </div>
      </div>

      {/* Section de promotion au rang de serviteur */}
      {soul && canPromoteToServant && !soul.isServant && (
        <>
          <Separator className="my-6" />
          <ServantPromotionForm 
            soul={soul} 
            onSuccess={onSoulUpdate}
          />
        </>
      )}
    </div>
  );
}