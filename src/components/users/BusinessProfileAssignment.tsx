import { useEffect, useRef, useState } from 'react';
import { BusinessProfile, BusinessProfileType, BUSINESS_PROFILE_LABELS, BUSINESS_PROFILE_DESCRIPTIONS, getProfileDepartmentIds, getProfileClassIds } from '../../types/businessProfile.types';
import { Star, ChevronDown, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getChurchId } from '../../lib/churchId';

interface BusinessProfileAssignmentProps {
  selectedProfiles: BusinessProfile[];
  onChange: (profiles: BusinessProfile[]) => void;
  allowMultiple?: boolean;
}

export function BusinessProfileAssignment({ selectedProfiles, onChange, allowMultiple = true }: BusinessProfileAssignmentProps) {
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from('departments')
      .select('id, name')
      .eq('church_id', getChurchId())
      .order('name')
      .then(({ data }: { data: { id: string; name: string }[] | null }) => setDepartments(data || []));
    supabase
      .from('academie_classes')
      .select('id, name')
      .eq('church_id', getChurchId())
      .order('name')
      .then(({ data }: { data: { id: string; name: string }[] | null }) => setClasses(data || []));
  }, []);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const toggleDepartment = (departmentId: string, profileType: BusinessProfileType = 'department_leader') => {
    const updated = selectedProfiles.map((p) => {
      if (p.type !== profileType) return p;
      const current = getProfileDepartmentIds(p);
      const next = current.includes(departmentId)
        ? current.filter((id) => id !== departmentId)
        : [...current, departmentId];
      return { ...p, departmentId: undefined, departmentIds: next };
    });
    onChange(updated);
  };
  const toggleClass = (classId: string) => {
    const updated = selectedProfiles.map((p) => {
      if (p.type !== 'academie_moderator') return p;
      const current = getProfileClassIds(p);
      const next = current.includes(classId)
        ? current.filter((id) => id !== classId)
        : [...current, classId];
      return { ...p, classIds: next };
    });
    onChange(updated);
  };
  const availableProfileTypes: BusinessProfileType[] = ['shepherd', 'department_leader', 'family_leader', 'adn', 'evangelist', 'pasteur_assistant', 'pasteur', 'academie_moderator', 'admin'];

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
        setIsOpen(false);
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

  const selectedCount = selectedProfiles.length;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        {allowMultiple
          ? 'Sélectionnez les profils métier de cet utilisateur. Le profil « Principal » (★) détermine son tableau de bord d\'accueil — il a en permanence les accès de tous ses profils.'
          : 'Sélectionnez un profil métier pour cet utilisateur.'}
      </p>

      {/* Liste déroulante multi-sélection */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(v => !v)}
          className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md shadow-sm text-left text-sm flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-[#00665C] focus:border-[#00665C]"
        >
          <span className={selectedCount === 0 ? 'text-gray-400' : 'text-gray-900'}>
            {selectedCount === 0
              ? 'Sélectionner les profils métier...'
              : `${selectedCount} profil${selectedCount > 1 ? 's' : ''} sélectionné${selectedCount > 1 ? 's' : ''}`}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
            {availableProfileTypes.map(profileType => {
              const selected = isProfileSelected(profileType);
              return (
                <button
                  key={profileType}
                  type="button"
                  onClick={() => toggleProfile(profileType)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                    selected ? 'bg-[#00665C]/5' : ''
                  }`}
                >
                  <span className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-[#00665C] border-[#00665C]' : 'border-gray-300'
                  }`}>
                    {selected && <Check className="w-3 h-3 text-white" />}
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-sm font-medium ${selected ? 'text-[#00665C]' : 'text-gray-700'}`}>
                      {BUSINESS_PROFILE_LABELS[profileType]}
                    </span>
                    <span className="block text-xs text-gray-500 mt-0.5">
                      {BUSINESS_PROFILE_DESCRIPTIONS[profileType]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Puces des profils sélectionnés : étoile = définir comme principal, croix = retirer */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProfiles.map(profile => {
            const label = BUSINESS_PROFILE_LABELS[profile.type];
            const isPrimary = !!profile.isPrimary;
            return (
              <span
                key={profile.type}
                className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 text-xs font-semibold rounded-full border ${
                  isPrimary
                    ? 'bg-[#F2B636]/15 border-[#F2B636]/50 text-[#7a5a00]'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                {allowMultiple ? (
                  <button
                    type="button"
                    onClick={() => setPrimary(profile.type)}
                    title={isPrimary ? 'Profil principal' : 'Définir comme profil principal'}
                    className="flex-shrink-0"
                  >
                    <Star className={`w-3.5 h-3.5 ${isPrimary ? 'fill-[#F2B636] text-[#F2B636]' : 'text-gray-300 hover:text-[#F2B636]'}`} />
                  </button>
                ) : null}
                {label}
                <button
                  type="button"
                  onClick={() => toggleProfile(profile.type)}
                  title="Retirer ce profil"
                  className="flex-shrink-0 p-0.5 rounded-full hover:bg-black/10"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {selectedCount === 0 && (
        <p className="text-sm text-gray-500 italic">
          Aucun profil sélectionné. L'utilisateur n'aura aucun accès au système.
        </p>
      )}

      {/* Département(s) pour un responsable de département */}
      {isProfileSelected('department_leader') && (
        <div className="pl-3 border-l-2 border-gray-100">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Département(s) dirigé(s)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Un responsable peut diriger plusieurs départements — cochez-en autant que nécessaire.
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 rounded-md p-2">
            {departments.map((d) => {
              const currentIds = getProfileDepartmentIds(selectedProfiles.find((p) => p.type === 'department_leader'));
              return (
                <label key={d.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentIds.includes(d.id)}
                    onChange={() => toggleDepartment(d.id)}
                    className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
                  />
                  {d.name}
                </label>
              );
            })}
          </div>
          {getProfileDepartmentIds(selectedProfiles.find((p) => p.type === 'department_leader')).length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Sans département, cet utilisateur n'aura pas accès aux fonctions liées (ex : rapport de culte).
            </p>
          )}
        </div>
      )}

      {/* Départements supervisés pour un Pasteur Assistant (PA/AP) */}
      {isProfileSelected('pasteur_assistant') && (
        <div className="pl-3 border-l-2 border-cyan-100">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Départements supervisés
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Le Pasteur Assistant voit les rapports, B.O.S.S et besoins signalés de ces départements.
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 rounded-md p-2">
            {departments.map((d) => {
              const currentIds = getProfileDepartmentIds(selectedProfiles.find((p) => p.type === 'pasteur_assistant'));
              return (
                <label key={d.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentIds.includes(d.id)}
                    onChange={() => toggleDepartment(d.id, 'pasteur_assistant')}
                    className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
                  />
                  {d.name}
                </label>
              );
            })}
          </div>
          {getProfileDepartmentIds(selectedProfiles.find((p) => p.type === 'pasteur_assistant')).length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Sans département supervisé, ce profil n'apportera aucun accès.
            </p>
          )}
        </div>
      )}

      {/* Classe(s) pour un modérateur Académie */}
      {isProfileSelected('academie_moderator') && (
        <div className="pl-3 border-l-2 border-emerald-100">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Classe(s) modérée(s)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Le modérateur gère le contenu (séances, ressources, devoirs) de ces classes.
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 rounded-md p-2">
            {classes.map((c) => {
              const currentIds = getProfileClassIds(selectedProfiles.find((p) => p.type === 'academie_moderator'));
              return (
                <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentIds.includes(c.id)}
                    onChange={() => toggleClass(c.id)}
                    className="h-4 w-4 text-[#00665C] border-gray-300 rounded focus:ring-[#00665C]"
                  />
                  {c.name}
                </label>
              );
            })}
          </div>
          {getProfileClassIds(selectedProfiles.find((p) => p.type === 'academie_moderator')).length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Sans classe assignée, ce profil n'apportera aucun accès.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
