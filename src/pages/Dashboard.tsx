import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { ShepherdDashboard } from '../components/dashboard/ShepherdDashboard';
import { ADNDashboard } from '../components/dashboard/ADNDashboard';
import DepartmentLeaderDashboard from '../components/servants/DepartmentLeaderDashboard';
import FamilyLeaderDashboard from '../components/dashboard/FamilyLeaderDashboard';
import EvangelistDashboard from '../components/dashboard/EvangelistDashboard';
import { PastorDashboard } from '../components/dashboard/PastorDashboard';
import { AssistantDashboard } from '../components/dashboard/AssistantDashboard';
import { ROLES } from '../constants/roles';
import { Crown, Shield, Heart, Briefcase, Home, Megaphone, Church, Eye } from 'lucide-react';

// Rôles disposant d'un tableau de bord dédié, dans l'ordre d'affichage des onglets
const DASHBOARD_VIEWS: { role: string; label: string; icon: React.ReactNode }[] = [
  { role: ROLES.ADMIN, label: 'Administration', icon: <Crown className="w-4 h-4" /> },
  { role: ROLES.SUPER_ADMIN, label: 'Administration', icon: <Crown className="w-4 h-4" /> },
  { role: ROLES.PASTEUR, label: 'Pasteur', icon: <Church className="w-4 h-4" /> },
  { role: ROLES.PASTEUR_ASSISTANT, label: 'Supervision', icon: <Eye className="w-4 h-4" /> },
  { role: ROLES.ADN, label: 'ADN', icon: <Shield className="w-4 h-4" /> },
  { role: ROLES.SHEPHERD, label: 'Berger(e)', icon: <Heart className="w-4 h-4" /> },
  { role: ROLES.DEPARTMENT_LEADER, label: 'Département', icon: <Briefcase className="w-4 h-4" /> },
  { role: ROLES.FAMILY_LEADER, label: 'Famille', icon: <Home className="w-4 h-4" /> },
  { role: ROLES.EVANGELIST, label: 'Évangéliste', icon: <Megaphone className="w-4 h-4" /> },
];

function renderDashboard(role: string) {
  switch (role) {
    case ROLES.SHEPHERD:
      return <ShepherdDashboard />;
    case ROLES.ADN:
      return <ADNDashboard />;
    case ROLES.DEPARTMENT_LEADER:
      return <DepartmentLeaderDashboard />;
    case ROLES.FAMILY_LEADER:
      return <FamilyLeaderDashboard />;
    case ROLES.EVANGELIST:
      return <EvangelistDashboard />;
    case ROLES.PASTEUR:
      return <PastorDashboard />;
    case ROLES.PASTEUR_ASSISTANT:
      return <AssistantDashboard />;
    case ROLES.ADMIN:
    case ROLES.SUPER_ADMIN:
      return <AdminDashboard />;
    default:
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">Rôle non reconnu</p>
        </div>
      );
  }
}

export default function Dashboard() {
  const { userRole, activeRole, availableRoles } = useAuth();

  // Casquettes détenues qui possèdent un tableau de bord, dédupliquées et ordonnées
  const heldRoles = new Set<string>([...(availableRoles as string[]), ...(userRole ? [userRole as string] : [])]);
  const views = DASHBOARD_VIEWS.filter(
    (v, i, arr) => heldRoles.has(v.role) && arr.findIndex(x => x.label === v.label) === i
  );

  // Vue par défaut : le profil principal
  const primaryRole = (activeRole || userRole) as string;
  const [selectedRole, setSelectedRole] = useState<string>(primaryRole);
  const currentRole = views.some(v => v.role === selectedRole) ? selectedRole : primaryRole;

  if (!userRole) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur de chargement du tableau de bord</p>
      </div>
    );
  }

  // Mono-profil : pas d'onglets, comportement inchangé
  if (views.length <= 1) {
    return renderDashboard(currentRole);
  }

  return (
    <div>
      {/* Sélecteur de vue : change uniquement l'affichage du tableau de bord (aucun impact sur les droits) */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {views.map(v => {
          const active = v.role === currentRole;
          return (
            <button
              key={v.role}
              onClick={() => setSelectedRole(v.role)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-full border whitespace-nowrap transition-colors ${
                active
                  ? 'bg-[#00665C] text-white border-[#00665C]'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#00665C]/40 hover:text-[#00665C]'
              }`}
            >
              {v.icon}
              {v.label}
            </button>
          );
        })}
      </div>
      {renderDashboard(currentRole)}
    </div>
  );
}
