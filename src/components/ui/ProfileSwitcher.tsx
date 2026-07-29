import {
  Crown, Shield, Heart, Briefcase, Home, Megaphone, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  BusinessProfileType,
  BUSINESS_PROFILE_LABELS
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

/**
 * Badge passif affichant les casquettes de l'utilisateur.
 * Plus de bascule de profil : l'utilisateur a en permanence l'union
 * des habilitations de tous ses profils.
 */
export function ProfileSwitcher() {
  const { user, userRole } = useAuth();

  const hasBusinessProfiles =
    user?.businessProfiles && user.businessProfiles.length > 0;

  /* ── Cas legacy : un seul rôle ── */
  if (!hasBusinessProfiles) {
    const role = userRole as string;
    const label = LEGACY_LABELS[role] ?? role ?? 'Utilisateur';
    const icon = PROFILE_ICONS[role as BusinessProfileType] ?? <User className="w-4 h-4" />;
    const colors = PROFILE_COLORS[role as BusinessProfileType]
      ?? 'text-gray-600 bg-gray-100 border-gray-200';
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border ${colors}`}>
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </span>
    );
  }

  /* ── Cas businessProfiles : un badge par casquette (principal en premier) ── */
  const profiles: BusinessProfile[] = [...user.businessProfiles].sort(
    (a: BusinessProfile, b: BusinessProfile) => Number(!!b.isPrimary) - Number(!!a.isPrimary)
  );

  return (
    <div className="flex items-center gap-1.5">
      {profiles.map((profile: BusinessProfile) => {
        const type = profile.type as BusinessProfileType;
        const colors = PROFILE_COLORS[type] ?? 'text-gray-600 bg-gray-100 border-gray-200';
        const icon = PROFILE_ICONS[type] ?? <User className="w-4 h-4" />;
        const label = BUSINESS_PROFILE_LABELS[type] ?? type;
        return (
          <span
            key={type}
            title={label}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-full border ${colors}`}
          >
            {icon}
            {/* Seul le profil principal affiche son libellé, les autres restent en icône */}
            {profile.isPrimary && <span className="hidden sm:inline">{label}</span>}
          </span>
        );
      })}
    </div>
  );
}
