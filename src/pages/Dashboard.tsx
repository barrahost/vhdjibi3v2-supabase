import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/dashboard/AdminDashboard';
import { ShepherdDashboard } from '../components/dashboard/ShepherdDashboard';
import { ADNDashboard } from '../components/dashboard/ADNDashboard';
import DepartmentLeaderDashboard from '../components/servants/DepartmentLeaderDashboard';
import FamilyLeaderDashboard from '../components/dashboard/FamilyLeaderDashboard';
import EvangelistDashboard from '../components/dashboard/EvangelistDashboard';
import { ROLES } from '../constants/roles';

export default function Dashboard() {
  const { userRole, activeRole } = useAuth();

  if (!userRole) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erreur de chargement du tableau de bord</p>
      </div>
    );
  }

  const currentRole = activeRole || userRole;
  switch (currentRole) {
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