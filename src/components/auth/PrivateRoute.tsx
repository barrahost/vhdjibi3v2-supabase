import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/permission.types';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
}

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#00665C]" />
        <span className="text-sm text-gray-500">Chargement...</span>
      </div>
    </div>
  );
}

export default function PrivateRoute({ children, requiredPermissions }: PrivateRouteProps) {
  const { loading, userRole, additionalMenus } = useAuth();
  const { hasPermission } = usePermissions();

  if (loading) {
    return <PageLoader />;
  }

  // Check if user exists in localStorage
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return <Navigate to="/login" />;
  }

  // Vérifier les permissions requises
  if (requiredPermissions && requiredPermissions.length > 0) {
    // Check if the user has any of the required permissions in their additional menus
    const hasAdditionalMenuAccess = requiredPermissions.some(permission => 
      additionalMenus.includes(permission)
    );
    
    // Check if the user has the required permissions based on their role
    const hasRoleAccess = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    
    const hasAccess = hasRoleAccess || hasAdditionalMenuAccess;
    
    if (!hasAccess) {
      if (['admin', 'super_admin', 'pasteur'].includes(userRole as string)) {
        return <Navigate to="/" />;
      } else if (userRole === 'shepherd') {
        return <Navigate to="/assigned-souls" />;
      } else if (userRole === 'adn') {
        return <Navigate to="/ames" />;
      } else if (userRole === 'family_leader') {
        return <Navigate to="/" />;
      }
      return <Navigate to="/" />;
    }
  }

  return children;
}