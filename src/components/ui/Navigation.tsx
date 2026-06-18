import { 
  LayoutDashboard, 
  MessageCircle, 
  TrendingUp, 
  AlertTriangle, 
  Heart, 
  Bell, 
  CalendarCheck, 
  Briefcase, 
  UsersRound,
  MessageSquare,
  MessagesSquare,
  UserCog,
  Map,
  Settings,
  Bug,
  Users,
  FileText,
  BarChart,
  BarChart2,
  Cake,
  Play,
  Headphones,
  User,
  Shield,
  Megaphone,
  Building2
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChurch } from '../../contexts/ChurchContext';
import { ROLES, PERMISSIONS } from '../../constants/roles';
import { usePermissions } from '../../hooks/usePermissions';
import { useAdminNotifications } from '../../hooks/useAdminNotifications';
import { ROLES as _ROLES } from '../../constants/roles';
import { AccordionMenu, MenuItem } from './AccordionMenu';

interface NavigationProps {
  onItemClick?: () => void;
}

export default function Navigation({ onItemClick }: NavigationProps) {
  const { userRole, activeRole, additionalMenus } = useAuth();
  const { hasPermission } = usePermissions();
  const { hasModule } = useChurch();

  const { alerts } = useAdminNotifications();

  // Extract counts from admin alerts for menu badges
  const alertCount = (type: string) =>
    alerts.find(a => a.type === type)?.count ?? 0;

  const getNavigationItems = (): MenuItem[] => {
    console.log('🔍 [Navigation] Building menu with permissions:', {
      userRole,
      activeRole,
      additionalMenus
    });
    
    // Start with common items
    const items: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Tableau de bord',
        icon: <LayoutDashboard className="w-5 h-5" />,
        href: '/'
      }
    ];

    // Build shepherd-specific menu - only for shepherds
    if (activeRole === ROLES.SHEPHERD && (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS) || hasPermission(PERMISSIONS.MANAGE_ATTENDANCES))) {
      const shepherdChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
        shepherdChildren.push(
          {
            id: 'assigned-souls',
            label: 'Mes Âmes',
            href: '/assigned-souls',
            icon: <Heart className="w-5 h-5" />,
            dataTour: 'nav-assigned-souls'
          },
          {
            id: 'interactions',
            label: 'Interactions',
            href: '/interactions',
            icon: <MessageCircle className="w-5 h-5" />,
            dataTour: 'nav-interactions-shepherd'
          }
        );
      }

      if (hasPermission(PERMISSIONS.MANAGE_ATTENDANCES)) {
        shepherdChildren.push({
          id: 'attendance',
          label: 'Présences',
          href: '/presences',
          icon: <CalendarCheck className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
        shepherdChildren.push({
          id: 'sms',
          label: 'SMS',
          href: '/sms',
          icon: <MessageSquare className="w-5 h-5" />
        });
      }

      shepherdChildren.push({
        id: 'reminders',
        label: 'Rappels',
        href: '/rappels',
        icon: <Bell className="w-5 h-5" />,
        dataTour: 'nav-reminders'
      });

      if (shepherdChildren.length > 0) {
        items.push({
          id: 'monitoring',
          label: 'Suivi',
          icon: <FileText className="w-5 h-5" />,
          children: shepherdChildren
        });
      }
    }

    // Build department management menu - only for department leaders
    if (activeRole === ROLES.DEPARTMENT_LEADER && (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS))) {
      const departmentChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS)) {
        departmentChildren.push({
          id: 'servants',
          label: 'Serviteurs',
          href: '/serviteurs',
          icon: <UsersRound className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
        departmentChildren.push({
          id: 'interactions',
          label: 'Interactions',
          href: '/interactions',
          icon: <MessageCircle className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_ATTENDANCES)) {
        departmentChildren.push({
          id: 'attendance',
          label: 'Présences',
          href: '/presences',
          icon: <CalendarCheck className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
        departmentChildren.push({
          id: 'sms',
          label: 'SMS',
          href: '/sms',
          icon: <MessageSquare className="w-5 h-5" />
        });
      }

      if (departmentChildren.length > 0) {
        items.push({
          id: 'department-management',
          label: 'Gestion Département',
          icon: <Briefcase className="w-5 h-5" />,
          children: departmentChildren
        });
      }
    }

    // Build souls management menu (for ADN and admins — not for family leaders)
    if (activeRole !== ROLES.FAMILY_LEADER && (hasPermission(PERMISSIONS.MANAGE_SOULS) || hasPermission(PERMISSIONS.MANAGE_USERS))) {
      const soulsChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_SOULS) && hasModule('souls')) {
        soulsChildren.push(
          {
            id: 'souls',
            label: 'Âmes',
            href: '/ames',
            icon: <Heart className="w-5 h-5" />,
            badge: alertCount('no_shepherd')
          },
          {
            id: 'undecided-souls',
            label: 'Âmes indécises',
            href: '/ames-indecises',
            icon: <AlertTriangle className="w-5 h-5" />,
            badge: alertCount('undecided')
          }
        );
      }

      if (hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && activeRole !== ROLES.EVANGELIST && hasModule('evangelization')) {
        soulsChildren.push({
          id: 'evangelized-souls-admin',
          label: 'Âmes évangélisées',
          href: '/ames-evangelisees',
          icon: <Megaphone className="w-5 h-5" />,
          badge: alertCount('pending_evangelized')
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_USERS) && hasModule('users')) {
        soulsChildren.push({
          id: 'users',
          label: 'Utilisateurs',
          href: '/users',
          icon: <UserCog className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SERVANTS) && hasModule('servants')) {
        soulsChildren.push({
          id: 'servants-admin',
          label: 'Serviteurs',
          href: '/serviteurs',
          icon: <UsersRound className="w-5 h-5" />
        });
      }


      if (soulsChildren.length > 0) {
        items.push({
          id: 'people-management',
          label: hasPermission(PERMISSIONS.MANAGE_USERS) ? 'Gestion des Personnes' : 'Gestion des Âmes & Suivi',
          icon: <Users className="w-5 h-5" />,
          children: soulsChildren
        });
      }
    }

    // Build family management menu - only for family leaders
    if (activeRole === ROLES.FAMILY_LEADER) {
      const familyChildren = [];

      // Âmes de la famille — toujours visible pour le chef de famille
      familyChildren.push({
        id: 'family-souls',
        label: 'Âmes',
        href: '/ma-famille/ames',
        icon: <Heart className="w-5 h-5" />
      });

      if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
        familyChildren.push(
          {
            id: 'family-interactions',
            label: 'Interactions',
            href: '/interactions',
            icon: <MessageCircle className="w-5 h-5" />
          },
          {
            id: 'family-reminders',
            label: 'Rappels',
            href: '/rappels',
            icon: <Bell className="w-5 h-5" />
          }
        );
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
        familyChildren.push({
          id: 'family-sms',
          label: 'SMS',
          href: '/sms',
          icon: <MessageSquare className="w-5 h-5" />
        });
      }

      if (familyChildren.length > 0) {
        items.push({
          id: 'family-management',
          label: 'Ma famille',
          icon: <UsersRound className="w-5 h-5" />,
          children: familyChildren
        });
      }
    }

    // Build tracking & interactions menu (for admins)
    if (hasPermission(PERMISSIONS.MANAGE_USERS) && hasPermission(PERMISSIONS.VIEW_STATS) && (hasModule('interactions') || hasModule('attendance') || hasModule('spiritual_progression'))) {
      items.push({
        id: 'tracking-interactions',
        label: 'Suivi & Interactions',
        icon: <MessageCircle className="w-5 h-5" />,
        children: [
          {
            id: 'interactions-admin',
            label: 'Interactions',
            href: '/interactions',
            icon: <MessageCircle className="w-5 h-5" />
          },
          {
            id: 'reminders-admin',
            label: 'Rappels',
            href: '/rappels-bergers',
            icon: <Bell className="w-5 h-5" />
          },
          {
            id: 'attendance-management',
            label: 'Gestion des présences',
            href: '/presences',
            icon: <CalendarCheck className="w-5 h-5" />
          },
          {
            id: 'attendance-view',
            label: 'Historique des présences',
            href: '/historique-presences',
            icon: <BarChart className="w-5 h-5" />
          },
          {
            id: 'progression',
            label: 'Progression spirituelle',
            href: '/spiritual-progression',
            icon: <TrendingUp className="w-5 h-5" />
          }
        ]
      });
    }

    // Statistiques dédiées (Admin/ADN avec VIEW_STATS)
    if (hasPermission(PERMISSIONS.VIEW_STATS) && activeRole !== ROLES.EVANGELIST && activeRole !== ROLES.SHEPHERD && activeRole !== ROLES.DEPARTMENT_LEADER && hasModule('statistics')) {
      items.push({
        id: 'statistics',
        label: 'Statistiques',
        icon: <BarChart2 className="w-5 h-5" />,
        children: [
          {
            id: 'stats-overview',
            label: "Vue d'ensemble",
            href: '/statistiques',
            icon: <BarChart className="w-5 h-5" />
          },
          {
            id: 'stats-pastoral',
            label: 'Suivi pastoral',
            href: '/statistiques?tab=pastoral',
            icon: <Heart className="w-5 h-5" />
          },
          {
            id: 'stats-spiritual',
            label: 'Progression spirituelle',
            href: '/statistiques?tab=spiritual',
            icon: <TrendingUp className="w-5 h-5" />
          },
          {
            id: 'stats-evangelization',
            label: 'Évangélisation',
            href: '/statistiques?tab=evangelization',
            icon: <Megaphone className="w-5 h-5" />
          }
        ]
      });
    }

    // Menu évangéliste : âmes évangélisées + interactions
    if (activeRole === ROLES.EVANGELIST && hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && hasModule('evangelization')) {
      items.push({
        id: 'evangelized-souls',
        label: 'Âmes évangélisées',
        icon: <Megaphone className="w-5 h-5" />,
        href: '/ames-evangelisees',
        dataTour: 'nav-evangelized-souls'
      });
      if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
        items.push({
          id: 'evangelist-interactions',
          label: 'Mes interactions',
          icon: <MessageCircle className="w-5 h-5" />,
          href: '/interactions',
          dataTour: 'nav-interactions-evangelist'
        });
      }
    }

    // Replay des enseignements - accessible à tous les utilisateurs authentifiés
    if (hasPermission(PERMISSIONS.VIEW_REPLAY_TEACHINGS) && hasModule('audio')) {
      items.push({
        id: 'replay-teachings-public',
        label: 'Replay des enseignements',
        icon: <Play className="w-5 h-5" />,
        href: '/replay'
      });
    }

    // Build content & communication menu - for admins only
    if (hasPermission(PERMISSIONS.MANAGE_AUDIO) || hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES)) {
      const contentChildren = [];
      
      if (hasPermission(PERMISSIONS.MANAGE_AUDIO) && hasModule('audio')) {
        contentChildren.push({
          id: 'audio',
          label: 'Gestion audio',
          href: '/audio',
          icon: <Headphones className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES) && hasModule('sms')) {
        contentChildren.push(
          {
            id: 'sms-admin',
            label: 'Gestion SMS',
            href: '/sms',
            icon: <MessagesSquare className="w-5 h-5" />
          },
          {
            id: 'sms-templates',
            label: 'Modèles SMS',
            href: '/modeles-sms',
            icon: <MessageSquare className="w-5 h-5" />
          }
        );
      }

      if (contentChildren.length > 0) {
        items.push({
          id: 'content-communication',
          label: 'Contenu & Communication',
          icon: <MessageSquare className="w-5 h-5" />,
          children: contentChildren
        });
      }
    }

    // Outils pastoraux (Carte des âmes, Anniversaires)
    if (hasPermission(PERMISSIONS.VIEW_STATS) && (hasModule('soul_map') || hasModule('birthdays'))) {
      const pastoralChildren = [];
      if (hasModule('soul_map')) {
        pastoralChildren.push({
          id: 'soul-map',
          label: 'Carte des âmes',
          href: '/carte',
          icon: <Map className="w-5 h-5" />
        });
      }
      if (hasModule('birthdays')) {
        pastoralChildren.push({
          id: 'birthdays',
          label: 'Anniversaires',
          href: '/anniversaires',
          icon: <Cake className="w-5 h-5" />,
          badge: alertCount('upcoming_birthday')
        });
      }
      if (pastoralChildren.length > 0) {
        items.push({
          id: 'pastoral-tools',
          label: 'Outils pastoraux',
          icon: <Map className="w-5 h-5" />,
          children: pastoralChildren
        });
      }
    }

    // Configuration (Départements, Familles, Paramètres, Rôles)
    if (hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS) || hasPermission(PERMISSIONS.MANAGE_SETTINGS) || hasPermission(PERMISSIONS.MANAGE_FAMILIES) || hasPermission(PERMISSIONS.MANAGE_ROLES_PERMISSIONS)) {
      const configChildren = [];

      if (hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS) && hasModule('departments')) {
        configChildren.push({
          id: 'departments',
          label: 'Départements',
          href: '/departements',
          icon: <Briefcase className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_FAMILIES)) {
        configChildren.push({
          id: 'service-families',
          label: 'Familles de service',
          href: '/familles',
          icon: <Users className="w-5 h-5" />
        });
      }

      if (hasPermission(PERMISSIONS.MANAGE_SETTINGS) || hasPermission(PERMISSIONS.MANAGE_ROLES_PERMISSIONS)) {
        configChildren.push({
          id: 'settings',
          label: 'Paramètres',
          href: '/parametres',
          icon: <Settings className="w-5 h-5" />
        });
      }

      // Gestion des églises — super admin central uniquement (bergerie-adm)
      const _hostname = window.location.hostname;
      const _isSuperAdminNav = _hostname.split('.')[0] === 'bergerie-adm';
      if (_isSuperAdminNav && userRole === 'super_admin') {
        configChildren.push({
          id: 'churches',
          label: 'Gestion des Églises',
          href: '/churches',
          icon: <Building2 className="w-5 h-5" />
        });
      }

      // Bug reports — visible uniquement pour super_admin
      if (userRole === 'super_admin') {
        configChildren.push({
          id: 'bug-reports',
          label: 'Signalements de bugs',
          href: '/bug-reports',
          icon: <Bug className="w-5 h-5" />
        });
      }

      if (configChildren.length > 0) {
        items.push({
          id: 'configuration',
          label: 'Configuration',
          icon: <Settings className="w-5 h-5" />,
          children: configChildren
        });
      }
    }

    return items;
  };

  return (
    <AccordionMenu items={getNavigationItems()} onItemClick={onItemClick} />
  );
}