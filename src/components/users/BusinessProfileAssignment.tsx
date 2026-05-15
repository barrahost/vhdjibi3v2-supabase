import { BusinessProfile, BusinessProfileType, BUSINESS_PROFILE_LABELS, BUSINESS_PROFILE_DESCRIPTIONS } from '../../types/businessProfile.types';
import { Star } from 'lucide-react';

interface BusinessProfileAssignmentProps {
  selectedProfiles: BusinessProfile[];
  onChange: (profiles: BusinessProfile[]) => void;
  allowMultiple?: boolean;
}

export function BusinessProfileAssignment({ selectedProfiles, onChange, allowMultiple = true }: BusinessProfileAssignmentProps) {
  const availableProfileTypes: BusinessProfileType[] = ['shepherd', 'department_leader', 'family_leader', 'adn', 'evangelist', 'admin'];

  const isProfileSelected = (profileType: BusinessProfileType): boolean => {
    return selectedProfiles.some(profile => profile.type === profileType);
  };

  const ensurePrimary = (profiles: BusinessProfile[]): BusinessProfile[] => {
    if (profiles.length === 0) return profiles;
    const hasPrimary = profiles.some(p => p.isPrimary);
    if (hasPrimary) return profiles;
    // Promote first profile as primary
    return profiles.map((p, i) => ({ ...p, isPrimary: i === 0 }));
  };

  const toggleProfile = (profileType: BusinessProfileType) => {
    const isSelected = isProfileSelected(profileType);

    if (isSelected) {
      const updated = selectedProfiles.filter(p => p.type !== profileType);
      onChange(ensurePrimary(updated));
    } else {
      const newProfile: BusinessProfile = {
        type: profileType,
        isActive: true,
        isPrimary: selectedProfiles.length === 0, // first one becomes primary by default
      };

      if (allowMultiple) {
        onChange(ensurePrimary([...selectedProfiles, newProfile]));
      } else {
        onChange([{ ...newProfile, isPrimary: true }]);
      }
    }
  };

  const setPrimary = (profileType: BusinessProfileType) => {
    const updated = selectedProfiles.map(p => ({
      ...p,
      isPrimary: p.type === profileType,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        {allowMultiple
          ? "Sélectionnez les profils métier pour cet utilisateur. Marquez celui qui sera utilisé par défaut à la connexion (Principal)."
          : "Sélectionnez un profil métier pour cet utilisateur."
        }
      </div>

      <div className="space-y-3 border border-gray-200 rounded-md p-4">
        {availableProfileTypes.map(profileType => {
          const selected = isProfileSelected(profileType);
          const profile = selectedProfiles.find(p => p.type === profileType);
          const isPrimary = !!profile?.isPrimary;

          return (
            <div key={profileType} className="flex items-start justify-between gap-3">
              <div className="flex items-start flex-1">
                <div className="flex items-center h-5">
                  <input
                    id={`profile-${profileType}`}
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleProfile(profileType)}
                    className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor={`profile-${profileType}`} className="font-medium text-gray-700 flex items-center gap-2">
                    {BUSINESS_PROFILE_LABELS[profileType]}
                    {isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F2B636]/20 text-[#7a5a00] text-xs font-medium">
                        <Star className="w-3 h-3 fill-[#F2B636] text-[#F2B636]" />
                        Principal
                      </span>
                    )}
                  </label>
                  <p className="text-gray-500 mt-1">
                    {BUSINESS_PROFILE_DESCRIPTIONS[profileType]}
                  </p>
                </div>
              </div>

              {selected && allowMultiple && (
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer whitespace-nowrap pt-0.5">
                  <input
                    type="radio"
                    name="primary-profile"
                    checked={isPrimary}
                    onChange={() => setPrimary(profileType)}
                    className="h-4 w-4 text-[#00665C] border-gray-300 focus:ring-[#00665C]"
                  />
                  Principal
                </label>
              )}
            </div>
          );
        })}

        {selectedProfiles.length === 0 && (
          <p className="text-sm text-gray-500 italic py-2">
            Aucun profil sélectionné. L'utilisateur n'aura aucun accès au système.
          </p>
        )}
      </div>

      {selectedProfiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <div className="text-sm font-medium text-blue-800 mb-1">
            Profils sélectionnés ({selectedProfiles.length}) :
          </div>
          <div className="text-sm text-blue-700">
            {selectedProfiles.map(profile => {
              const label = BUSINESS_PROFILE_LABELS[profile.type];
              return profile.isPrimary ? `${label} ★` : label;
            }).join(', ')}
          </div>
          {allowMultiple && selectedProfiles.length > 1 && (
            <p className="text-xs text-blue-600 mt-2">
              💡 Le profil marqué « Principal » sera celui actif lors de la connexion. L'utilisateur peut basculer ensuite.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
