import { useState, useRef, useEffect } from 'react';
import {
  ChevronDown, Check,
  Crown, Shield, Users, Heart, Briefcase, Home, Megaphone, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  BusinessProfileType,
  BUSINESS_PROFILE_LABELS,
  BUSINESS_PROFILE_DESCRIPTIONS
} from '../../types/businessProfile.types';
import type { BusinessProfile } from '../../types/businessProfile.types';

/* ─── Icônes par profil ──────────────────────────────────────────── */
const PROFILE_ICONS: Record<BusinessProfileType, React.ReactNode> = {
  admin:             <Crown      className="w-4 h-4" />,
  adn:               <Shield     className="w-4 h-4" />,
  shepherd:          <Heart      className="w-4 h-4" />,
  department_leader: <Briefcase  className="w-4 h-4" />,
  family_leader:     <Home       className="w-4 h-4" />,
  evangelist:        <Megaphone  className="w-4 h-4" />,
};

/* ─── Couleur accent par profil ─────────────────────────────────── */
const PROFILE_COLORS: Record<BusinessProfileType, string> = {
  admin:             'text-red-600    bg-red-50    border-red-200',
  adn:               'text-purple-600 bg-purple-50 border-purple-200',
  shepherd:          'text-[#00665C]  bg-[#00665C]/10 border-[#00665C]/20',
  department_leader: 'text-blue-600   bg-blue-50   border-blue-200',
  family_leader:     'text-orange-600 bg-orange-50 border-orange-200',
  evangelist:        'text-[#F2B636]  bg-[#F2B636]/10 border-[#F2B636]/20',
};

/* ─── Libellé rôle legacy (sans businessProfiles) ───────────────── */
const LEGACY_LABELS: Record<string, string> = {
  super_admin:       'Super Admin',
  admin:             'Administrateur',
  shepherd:          'Berger(e)',
  intern:            'Stagiaire',
  adn:               'ADN',
  department_leader: 'Responsable Département',
  family_leader:     'Responsable de Famille',
  evangelist:        'Évangéliste',
};

export function ProfileSwitcher() {
  const { user, userRole, activeRole, switchToProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  /* Fermer sur clic extérieur */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hasBusinessProfiles =
    user?.businessProfiles && user.businessProfiles.length > 0;

  /* ── Cas legacy : un seul rôle, pas de switch ── */
  if (!hasBusinessProfiles) {
    const role = (activeRole || userRole) as string;
    const label = LEGACY_LABELS[role] ?? role ?? 'Utilisateur';
    const icon = PROFILE_ICONS[role as BusinessProfileType] ?? <User className="w-4 h-4" />;
    const colors = PROFILE_COLORS[role as BusinessProfileType]
      ?? 'text-gray-600 bg-gray-100 border-gray-200';
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${colors}`}>
        {icon}
        {label}
      </span>
    );
  }

  /* ── Cas multi-profils ── */
  const profiles: BusinessProfile[] = user.businessProfiles;
  const activeProfile = profiles.find((p: BusinessProfile) => p.isActive);
  const activeType = activeProfile?.type as BusinessProfileType | undefined;
  const activeColors = activeType
    ? PROFILE_COLORS[activeType]
    : 'text-gray-600 bg-gray-100 border-gray-200';
  const activeIcon = activeType
    ? PROFILE_ICONS[activeType]
    : <User className="w-4 h-4" />;
  const activeLabel = activeType
    ? BUSINESS_PROFILE_LABELS[activeType]
    : 'Aucun profil';

  const handleSwitch = async (type: BusinessProfileType) => {
    if (type === activeType) { setIsOpen(false); return; }
    await switchToProfile(type);
    setIsOpen(false);
    navigate('/');           // ← toujours retour au tableau de bord
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton déclencheur */}
      <button
        onClick={() => setIsOpen(v => !v)}
        data-tour="profile-switcher"
        className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors hover:opacity-80 ${activeColors}`}
        title="Changer de profil"
      >
        {activeIcon}
        <span className="hidden sm:inline">{activeLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] overflow-hidden">
          {/* En-tête */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Changer de profil
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Le tableau de bord s'adapte à votre profil actif
            </p>
          </div>

          {/* Liste des profils */}
          <ul className="py-2">
            {profiles.map((profile: BusinessProfile) => {
              const type = profile.type as BusinessProfileType;
              const isActive = profile.isActive;
              const colors = PROFILE_COLORS[type] ?? 'text-gray-600 bg-gray-100';
              const icon = PROFILE_ICONS[type] ?? <User className="w-4 h-4" />;

              return (
                <li key={type}>
                  <button
                    onClick={() => handleSwitch(type)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${isActive
                        ? 'bg-gray-50'
                        : 'hover:bg-gray-50'
                      }`}
                  >
                    {/* Icône profil colorée */}
                    <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border ${colors}`}>
                      {icon}
                    </span>

                    {/* Texte */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                          {BUSINESS_PROFILE_LABELS[type]}
                        </span>
                        {profile.isPrimary && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F2B636]/20 text-[#7a5a00] font-semibold leading-none">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {BUSINESS_PROFILE_DESCRIPTIONS[type]}
                      </p>
                    </div>

                    {/* Checkmark si actif */}
                    {isActive
                      ? <Check className="flex-shrink-0 w-4 h-4 text-[#00665C]" />
                      : <div className="flex-shrink-0 w-4 h-4 rounded-full border-2 border-gray-300" />
                    }
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Pied : profil actif en résumé */}
          {activeProfile && activeType && (
            <div className={`px-4 py-3 border-t border-gray-100 flex items-center gap-2 ${PROFILE_COLORS[activeType]}`}>
              <span className="flex-shrink-0">{activeIcon}</span>
              <p className="text-xs font-medium">
                Profil actif : <strong>{activeLabel}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
