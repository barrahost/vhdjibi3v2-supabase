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
  Shield,
  Megaphone,
  Building2,
  CalendarDays,
  HandHeart,
  History,
  HandHelping,
  Mic,
  Presentation,
  Coins,
  BookOpen,
  Radio,
  Wheat,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useChurch } from '../contexts/ChurchContext';
import { ROLES, PERMISSIONS } from '../constants/roles';
import { usePermissions } from './usePermissions';
import { useAdminNotifications } from './useAdminNotifications';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';
import { getProfileDepartmentIds } from '../types/businessProfile.types';
import { CulteReportType, DEPARTMENT_TO_REPORT_TYPE, normalizeDeptName } from '../types/culteReport.types';

const CULTE_REPORT_NAV_LABEL: Record<CulteReportType, string> = {
  worship: 'Gestion de Culte',
  adn: 'ADN',
  finance: 'Finance',
  academie: 'Académie',
  sainte_cene: 'Sainte Cène',
  sono: 'Communication & Sono',
};

const CULTE_REPORT_NAV_ICON: Record<CulteReportType, React.ReactNode> = {
  worship: <Presentation className="w-5 h-5" />,
  adn: <Users className="w-5 h-5" />,
  finance: <Coins className="w-5 h-5" />,
  academie: <BookOpen className="w-5 h-5" />,
  sainte_cene: <Wheat className="w-5 h-5" />,
  sono: <Radio className="w-5 h-5" />,
};

export interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: number;
  dataTour?: string;
  children?: NavItem[];
}

export function useNavigationItems(): NavItem[] {
  const { user, userRole, activeRole } = useAuth();
  const { hasPermission } = usePermissions();
  const { hasModule } = useChurch();
  const { alerts } = useAdminNotifications();

  const alertCount = (type: string) =>
    alerts.find(a => a.type === type)?.count ?? 0;

  const [ledCulteReports, setLedCulteReports] = useState<{ reportType: CulteReportType }[]>([]);

  useEffect(() => {
    if (activeRole !== ROLES.DEPARTMENT_LEADER || !user?.businessProfiles) {
      setLedCulteReports([]);
      return;
    }
    const profile = (user.businessProfiles as any[]).find((p) => p.type === 'department_leader');
    const departmentIds = getProfileDepartmentIds(profile);
    if (departmentIds.length === 0) {
      setLedCulteReports([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .eq('church_id', getChurchId())
        .in('id', departmentIds);
      const mapped = (data || [])
        .map((d: { id: string; name: string }) => {
          const reportType = DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(d.name)];
          return reportType ? { reportType } : null;
        })
        .filter((d: { reportType: CulteReportType } | null): d is { reportType: CulteReportType } => d !== null);
      if (!cancelled) setLedCulteReports(mapped);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeRole, user]);

  const items: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/',
    },
  ];

  // Shepherd menu
  if (
    activeRole === ROLES.SHEPHERD &&
    (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS) || hasPermission(PERMISSIONS.MANAGE_ATTENDANCES))
  ) {
    const children: NavItem[] = [];

    if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
      children.push(
        { id: 'assigned-souls', label: 'Mes Âmes', href: '/assigned-souls', icon: <Heart className="w-5 h-5" />, dataTour: 'nav-assigned-souls' },
        { id: 'interactions', label: 'Interactions', href: '/interactions', icon: <MessageCircle className="w-5 h-5" />, dataTour: 'nav-interactions-shepherd' }
      );
    }
    if (hasPermission(PERMISSIONS.MANAGE_ATTENDANCES)) {
      children.push({ id: 'attendance', label: 'Présences', href: '/presences', icon: <CalendarCheck className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
      children.push({ id: 'sms', label: 'SMS', href: '/sms', icon: <MessageSquare className="w-5 h-5" /> });
    }
    children.push({ id: 'reminders', label: 'Rappels', href: '/rappels', icon: <Bell className="w-5 h-5" />, dataTour: 'nav-reminders' });

    if (children.length > 0) {
      items.push({ id: 'monitoring', label: 'Suivi', icon: <FileText className="w-5 h-5" />, children });
    }
  }

  // Department leader menu
  if (
    activeRole === ROLES.DEPARTMENT_LEADER &&
    (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS))
  ) {
    const children: NavItem[] = [];

    if (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS)) {
      children.push({ id: 'servants', label: 'Serviteurs', href: '/serviteurs', icon: <UsersRound className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
      children.push({ id: 'interactions', label: 'Interactions', href: '/interactions', icon: <MessageCircle className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_ATTENDANCES)) {
      children.push({ id: 'attendance', label: 'Présences', href: '/presences', icon: <CalendarCheck className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
      children.push({ id: 'sms', label: 'SMS', href: '/sms', icon: <MessageSquare className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_CULTE_REPORTS)) {
      if (ledCulteReports.length > 0) {
        ledCulteReports.forEach(({ reportType }) => {
          children.push({
            id: `culte-report-${reportType}`,
            label: CULTE_REPORT_NAV_LABEL[reportType],
            href: `/rapports/${reportType}`,
            icon: CULTE_REPORT_NAV_ICON[reportType],
          });
        });
      } else {
        children.push({ id: 'culte-report', label: 'Rapport de culte', href: '/rapport-culte', icon: <FileText className="w-5 h-5" /> });
      }
    }

    if (children.length > 0) {
      items.push({ id: 'department-management', label: 'Gestion Département', icon: <Briefcase className="w-5 h-5" />, children });
    }
  }

  // Souls management (ADN + admin, not family leaders)
  if (
    activeRole !== ROLES.FAMILY_LEADER &&
    (hasPermission(PERMISSIONS.MANAGE_SOULS) || hasPermission(PERMISSIONS.MANAGE_USERS))
  ) {
    const children: NavItem[] = [];

    if (hasPermission(PERMISSIONS.MANAGE_SOULS) && hasModule('souls')) {
      children.push(
        { id: 'souls', label: 'Âmes', href: '/ames', icon: <Heart className="w-5 h-5" />, badge: alertCount('no_shepherd') },
        { id: 'undecided-souls', label: 'Âmes indécises', href: '/ames-indecises', icon: <AlertTriangle className="w-5 h-5" />, badge: alertCount('undecided') }
      );
    }
    if (hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && activeRole !== ROLES.EVANGELIST && hasModule('evangelization')) {
      children.push({ id: 'evangelized-souls-admin', label: 'Âmes évangélisées', href: '/ames-evangelisees', icon: <Megaphone className="w-5 h-5" />, badge: alertCount('pending_evangelized') });
    }
    if (hasPermission(PERMISSIONS.MANAGE_USERS) && hasModule('users')) {
      children.push({ id: 'users', label: 'Utilisateurs', href: '/users', icon: <UserCog className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_FAMILIES)) {
      children.push({ id: 'shepherd-families', label: 'Bergers & Familles', href: '/bergers', icon: <Users className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_SERVANTS) && hasModule('servants')) {
      children.push({ id: 'servants-admin', label: 'Serviteurs', href: '/serviteurs', icon: <UsersRound className="w-5 h-5" /> });
    }

    if (children.length > 0) {
      items.push({
        id: 'people-management',
        label: hasPermission(PERMISSIONS.MANAGE_USERS) ? 'Gestion des Personnes' : 'Gestion des Âmes',
        icon: <Users className="w-5 h-5" />,
        children,
      });
    }
  }

  // Family leader menu
  if (activeRole === ROLES.FAMILY_LEADER) {
    const children: NavItem[] = [
      { id: 'family-souls', label: 'Âmes', href: '/ma-famille/ames', icon: <Heart className="w-5 h-5" /> },
      { id: 'family-shepherds', label: 'Bergers', href: '/ma-famille/bergers', icon: <Users className="w-5 h-5" /> },
      { id: 'family-progression', label: 'Progression', href: '/ma-famille/progression', icon: <TrendingUp className="w-5 h-5" /> },
    ];

    if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
      children.push(
        { id: 'family-interactions', label: 'Interactions', href: '/interactions', icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'family-reminders', label: 'Rappels', href: '/rappels', icon: <Bell className="w-5 h-5" /> }
      );
    }
    if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
      children.push({ id: 'family-sms', label: 'SMS', href: '/sms', icon: <MessageSquare className="w-5 h-5" /> });
    }

    items.push({ id: 'family-management', label: 'Ma famille', icon: <UsersRound className="w-5 h-5" />, children });
  }

  // Admin tracking & interactions
  if (
    hasPermission(PERMISSIONS.MANAGE_USERS) &&
    hasPermission(PERMISSIONS.VIEW_STATS) &&
    (hasModule('interactions') || hasModule('attendance') || hasModule('spiritual_progression'))
  ) {
    items.push({
      id: 'tracking-interactions',
      label: 'Suivi & Interactions',
      icon: <MessageCircle className="w-5 h-5" />,
      children: [
        { id: 'interactions-admin', label: 'Interactions', href: '/interactions', icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'reminders-admin', label: 'Rappels', href: '/rappels-bergers', icon: <Bell className="w-5 h-5" /> },
        { id: 'attendance-management', label: 'Gestion des présences', href: '/presences', icon: <CalendarCheck className="w-5 h-5" /> },
        { id: 'attendance-view', label: 'Historique des présences', href: '/historique-presences', icon: <BarChart className="w-5 h-5" /> },
        { id: 'progression', label: 'Progression spirituelle', href: '/spiritual-progression', icon: <TrendingUp className="w-5 h-5" /> },
      ],
    });
  }

  // Statistics (admin only, not ADN)
  if (
    hasPermission(PERMISSIONS.VIEW_STATS) &&
    activeRole !== ROLES.EVANGELIST &&
    activeRole !== ROLES.SHEPHERD &&
    activeRole !== ROLES.DEPARTMENT_LEADER &&
    activeRole !== ROLES.ADN &&
    hasModule('statistics')
  ) {
    items.push({
      id: 'statistics',
      label: 'Statistiques',
      icon: <BarChart2 className="w-5 h-5" />,
      children: [
        { id: 'stats-overview', label: "Vue d'ensemble", href: '/statistiques', icon: <BarChart className="w-5 h-5" /> },
        { id: 'stats-pastoral', label: 'Suivi pastoral', href: '/statistiques?tab=pastoral', icon: <Heart className="w-5 h-5" /> },
        { id: 'stats-spiritual', label: 'Progression spirituelle', href: '/statistiques?tab=spiritual', icon: <TrendingUp className="w-5 h-5" /> },
        { id: 'stats-evangelization', label: 'Évangélisation', href: '/statistiques?tab=evangelization', icon: <Megaphone className="w-5 h-5" /> },
      ],
    });
  }

  // Evangelist menu
  if (activeRole === ROLES.EVANGELIST && hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && hasModule('evangelization')) {
    items.push({ id: 'evangelized-souls', label: 'Âmes évangélisées', icon: <Megaphone className="w-5 h-5" />, href: '/ames-evangelisees', dataTour: 'nav-evangelized-souls' });
    if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
      items.push({ id: 'evangelist-interactions', label: 'Mes interactions', icon: <MessageCircle className="w-5 h-5" />, href: '/interactions', dataTour: 'nav-interactions-evangelist' });
    }
  }

  // Replay (not ADN)
  if (hasPermission(PERMISSIONS.VIEW_REPLAY_TEACHINGS) && activeRole !== ROLES.ADN && hasModule('audio')) {
    items.push({ id: 'replay-teachings-public', label: 'Replay des enseignements', icon: <Play className="w-5 h-5" />, href: '/replay' });
  }

  // Content & Communication (not ADN)
  if ((hasPermission(PERMISSIONS.MANAGE_AUDIO) || hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES)) && activeRole !== ROLES.ADN) {
    const children: NavItem[] = [];

    if (hasPermission(PERMISSIONS.MANAGE_AUDIO) && hasModule('audio')) {
      children.push({ id: 'audio', label: 'Gestion audio', href: '/audio', icon: <Headphones className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES) && hasModule('sms')) {
      children.push(
        { id: 'sms-admin', label: 'Gestion SMS', href: '/sms', icon: <MessagesSquare className="w-5 h-5" /> },
        { id: 'sms-templates', label: 'Modèles SMS', href: '/modeles-sms', icon: <MessageSquare className="w-5 h-5" /> }
      );
    }

    if (children.length > 0) {
      items.push({ id: 'content-communication', label: 'Contenu & Communication', icon: <MessageSquare className="w-5 h-5" />, children });
    }
  }

  // Pastoral tools (not ADN)
  if (hasPermission(PERMISSIONS.VIEW_STATS) && activeRole !== ROLES.ADN && (hasModule('soul_map') || hasModule('birthdays'))) {
    const children: NavItem[] = [];

    if (hasModule('soul_map')) {
      children.push({ id: 'soul-map', label: 'Carte des âmes', href: '/carte', icon: <Map className="w-5 h-5" /> });
    }
    if (hasModule('birthdays')) {
      children.push({ id: 'birthdays', label: 'Anniversaires', href: '/anniversaires', icon: <Cake className="w-5 h-5" />, badge: alertCount('upcoming_birthday') });
    }

    if (children.length > 0) {
      items.push({ id: 'pastoral-tools', label: 'Outils pastoraux', icon: <Map className="w-5 h-5" />, children });
    }
  }

  // Absences (congés + absences courtes) (admin / super_admin)
  if (hasPermission(PERMISSIONS.MANAGE_LEAVES)) {
    items.push({
      id: 'leaves',
      label: 'Absences',
      icon: <CalendarDays className="w-5 h-5" />,
      href: '/absences',
    });
  }

  // Chaîne de prière (admin / super_admin)
  if (hasPermission(PERMISSIONS.MANAGE_PRAYER_REQUESTS)) {
    items.push({
      id: 'prayer-requests',
      label: 'Chaîne de prière',
      icon: <HandHeart className="w-5 h-5" />,
      href: '/prieres',
    });
  }

  // Rapports de culte (admin / super_admin) : tableau de bord + une page par département + besoins
  if (hasPermission(PERMISSIONS.MANAGE_CULTE_REPORTS) && activeRole !== ROLES.DEPARTMENT_LEADER) {
    items.push({
      id: 'culte-reports',
      label: 'Rapports de culte',
      icon: <History className="w-5 h-5" />,
      children: [
        { id: 'culte-reports-dashboard', label: 'Tableau de bord', href: '/tableau-de-bord-rapports', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'culte-reports-worship', label: 'Gestion de Culte', href: '/rapports/worship', icon: <Presentation className="w-5 h-5" /> },
        { id: 'culte-reports-adn', label: 'ADN', href: '/rapports/adn', icon: <Users className="w-5 h-5" /> },
        { id: 'culte-reports-finance', label: 'Finance', href: '/rapports/finance', icon: <Coins className="w-5 h-5" /> },
        { id: 'culte-reports-academie', label: 'Académie', href: '/rapports/academie', icon: <BookOpen className="w-5 h-5" /> },
        { id: 'culte-reports-sainte-cene', label: 'Sainte Cène', href: '/rapports/sainte_cene', icon: <Wheat className="w-5 h-5" /> },
        { id: 'culte-reports-sono', label: 'Communication & Sono', href: '/rapports/sono', icon: <Radio className="w-5 h-5" /> },
        { id: 'culte-reports-needs', label: 'Besoins signalés', href: '/besoins-rapports', icon: <HandHelping className="w-5 h-5" /> },
      ],
    });
  }

  // Configuration
  if (
    hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS) ||
    hasPermission(PERMISSIONS.MANAGE_SETTINGS) ||
    hasPermission(PERMISSIONS.MANAGE_FAMILIES) ||
    hasPermission(PERMISSIONS.MANAGE_ROLES_PERMISSIONS) ||
    hasPermission(PERMISSIONS.MANAGE_CULTE_REPORTS)
  ) {
    const children: NavItem[] = [];

    if (hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS) && hasModule('departments')) {
      children.push({ id: 'departments', label: 'Départements', href: '/departements', icon: <Briefcase className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_FAMILIES)) {
      children.push({ id: 'service-families', label: 'Familles de service', href: '/familles', icon: <Users className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_SETTINGS) || hasPermission(PERMISSIONS.MANAGE_ROLES_PERMISSIONS)) {
      children.push({ id: 'settings', label: 'Paramètres', href: '/parametres', icon: <Settings className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_CULTE_REPORTS) && activeRole !== ROLES.DEPARTMENT_LEADER) {
      children.push({ id: 'meeting-types', label: 'Types de rencontre', href: '/parametres-types-rencontre', icon: <CalendarDays className="w-5 h-5" /> });
      children.push({ id: 'speakers', label: 'Orateurs', href: '/parametres-orateurs', icon: <Mic className="w-5 h-5" /> });
    }

    const hostname = window.location.hostname;
    if (hostname.split('.')[0] === 'bergerie-adm' && userRole === 'super_admin') {
      children.push({ id: 'churches', label: 'Gestion des Églises', href: '/churches', icon: <Building2 className="w-5 h-5" /> });
    }
    if (userRole === 'super_admin') {
      children.push({ id: 'bug-reports', label: 'Signalements de bugs', href: '/bug-reports', icon: <Bug className="w-5 h-5" /> });
    }

    if (children.length > 0) {
      items.push({ id: 'configuration', label: 'Configuration', icon: <Settings className="w-5 h-5" />, children });
    }
  }

  return items;
}
