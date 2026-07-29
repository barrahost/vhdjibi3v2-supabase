import { SpiritualProfile, Soul } from '../../../types/database.types';
import { SpiritualCheckbox } from './SpiritualCheckbox';
import ServantPromotionForm from './ServantPromotionForm';
import { usePermissions } from '../../../hooks/usePermissions';
import { Separator } from '../../ui/separator';

interface ProgressionFormProps {
  value: SpiritualProfile;
  onChange: (profile: SpiritualProfile) => void;
  soul?: Soul; // Ajout de l'âme pour la promotion
  onSoulUpdate?: () => void;
}

export function ProgressionForm({ value, onChange, soul, onSoulUpdate }: ProgressionFormProps) {
  const { hasPermission } = usePermissions();

  const canPromoteToServant = hasPermission('PROMOTE_SOUL_TO_SERVANT');

  const handleChange = (field: keyof SpiritualProfile, newValue: any) => {
    const updatedProfile = { ...value };

    // Define mapping for date fields
    const dateFieldMap: Record<string, keyof SpiritualProfile> = {
      isBornAgain: 'bornAgainDate',
      isBaptized: 'baptismDate',
      isEnrolledInAcademy: 'academyEnrollmentDate',
      isEnrolledInLifeBearers: 'lifeBearersEnrollmentDate'
    };

    if (typeof newValue === 'boolean' && (
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

  return (
    <div className="space-y-6">
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

      {/* Section de promotion au rang de B.O.S.S */}
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
