import {
  LayoutDashboard,
  MessageCircle,
  TrendingUp,
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
  CalendarRange,
  Presentation,
  Coins,
  BookOpen,
  Radio,
  Wheat,
  Clock,
  Trophy,
  Eye,
  Network,
  GraduationCap,
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
  finance: 'Emmeraude',
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
  const { user, userRole, availableRoles } = useAuth();
  const { hasPermission } = usePermissions();
  const { hasModule } = useChurch();
  const { alerts } = useAdminNotifications();

  // Plus de bascule de profil : le menu montre l'union de toutes les casquettes détenues.
  const heldRoles = new Set<string>(availableRoles as string[]);
  if (userRole) heldRoles.add(userRole as string);
  const hasRole = (role: string) => heldRoles.has(role);
  const onlyRole = (role: string) => heldRoles.size > 0 && Array.from(heldRoles).every(r => r === role);
  const isAdmin = hasRole(ROLES.ADMIN) || hasRole(ROLES.SUPER_ADMIN);

  const alertCount = (type: string) =>
    alerts.find(a => a.type === type)?.count ?? 0;

  const [ledCulteReports, setLedCulteReports] = useState<{ reportType: CulteReportType }[]>([]);
  const [supervisedCulteReports, setSupervisedCulteReports] = useState<{ reportType: CulteReportType }[]>([]);

  useEffect(() => {
    if (!hasRole(ROLES.DEPARTMENT_LEADER) || !user?.businessProfiles) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Pasteur Assistant : departements supervises ayant une page de rapports,
  // hors ceux qu'il dirige deja lui-meme (deja listes dans son groupe Rapport).
  useEffect(() => {
    if (!hasRole(ROLES.PASTEUR_ASSISTANT) || !user?.businessProfiles) {
      setSupervisedCulteReports([]);
      return;
    }
    const profiles = user.businessProfiles as any[];
    const ownIds = new Set(getProfileDepartmentIds(profiles.find((p) => p.type === 'department_leader')));
    const paIds = getProfileDepartmentIds(profiles.find((p) => p.type === 'pasteur_assistant'))
      .filter((id) => !ownIds.has(id));
    if (paIds.length === 0) {
      setSupervisedCulteReports([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('departments')
        .select('id, name')
        .eq('church_id', getChurchId())
        .in('id', paIds);
      const mapped = (data || [])
        .map((d: { id: string; name: string }) => {
          const reportType = DEPARTMENT_TO_REPORT_TYPE[normalizeDeptName(d.name)];
          return reportType ? { reportType } : null;
        })
        .filter((d: { reportType: CulteReportType } | null): d is { reportType: CulteReportType } => d !== null);
      if (!cancelled) setSupervisedCulteReports(mapped);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    hasRole(ROLES.SHEPHERD) &&
    (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS) || hasPermission(PERMISSIONS.MANAGE_ATTENDANCES))
  ) {
    const children: NavItem[] = [];

    if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
      children.push(
        { id: 'assigned-souls', label: 'Mes âmes suivies', href: '/assigned-souls', icon: <Heart className="w-5 h-5" />, dataTour: 'nav-assigned-souls' },
        { id: 'interactions', label: 'Mes interactions', href: '/interactions', icon: <MessageCircle className="w-5 h-5" />, dataTour: 'nav-interactions-shepherd' }
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
      items.push({ id: 'monitoring', label: 'Suivi berger', icon: <Heart className="w-5 h-5" />, children });
    }
  }

  // Department leader menu (pas pour les admins : ils ont leur propre section rapports complète)
  if (
    hasRole(ROLES.DEPARTMENT_LEADER) && !isAdmin &&
    (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS))
  ) {
    const children: NavItem[] = [];

    // Rapport(s) de culte en premier : c'est l'action la plus frequente d'un responsable de
    // departement, et le menu mobile (bottom nav) prend le premier enfant comme raccourci direct.
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
    if (hasPermission(PERMISSIONS.MANAGE_SERVANTS) || hasPermission(PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS)) {
      children.push({ id: 'servants', label: 'B.O.S.S', href: '/serviteurs', icon: <UsersRound className="w-5 h-5" /> });
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

    if (children.length > 0) {
      items.push({ id: 'department-management', label: 'Rapport', icon: <Briefcase className="w-5 h-5" />, children });
    }
  }

  // Pasteur Assistant : espace Supervision de son portefeuille de departements
  if (hasRole(ROLES.PASTEUR_ASSISTANT) && !isAdmin) {
    const children: NavItem[] = [];
    supervisedCulteReports.forEach(({ reportType }) => {
      children.push({
        id: `pa-report-${reportType}`,
        label: CULTE_REPORT_NAV_LABEL[reportType],
        href: `/rapports/${reportType}`,
        icon: CULTE_REPORT_NAV_ICON[reportType],
      });
    });
    children.push({ id: 'pa-servants', label: 'B.O.S.S', href: '/serviteurs', icon: <UsersRound className="w-5 h-5" /> });
    children.push({ id: 'pa-needs', label: 'Besoins signalés', href: '/besoins-rapports', icon: <HandHelping className="w-5 h-5" /> });
    items.push({ id: 'pa-supervision', label: 'Supervision', icon: <Eye className="w-5 h-5" />, children });
  }

  // Souls management (ADN + admin + pasteur, not family leaders)
  if (
    (hasRole(ROLES.ADN) || isAdmin || hasRole(ROLES.PASTEUR)) &&
    (hasPermission(PERMISSIONS.MANAGE_SOULS) || hasPermission(PERMISSIONS.MANAGE_USERS))
  ) {
    const children: NavItem[] = [];

    if (hasPermission(PERMISSIONS.MANAGE_SOULS) && hasModule('souls')) {
      const evangelizedBadge = (hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && isAdmin && hasModule('evangelization'))
        ? alertCount('pending_evangelized')
        : 0;
      children.push(
        { id: 'souls', label: 'Toutes les âmes', href: '/ames', icon: <Heart className="w-5 h-5" />, badge: alertCount('no_shepherd') + alertCount('undecided') + evangelizedBadge }
      );
    } else if (hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && hasModule('evangelization')) {
      children.push({ id: 'evangelized-souls-admin', label: 'Âmes évangélisées', href: '/ames-evangelisees', icon: <Megaphone className="w-5 h-5" />, badge: alertCount('pending_evangelized') });
    }
    if (hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && hasModule('evangelization')) {
      children.push({ id: 'evangelized-signals', label: 'Signalements évangélistes', href: '/signalements-evangelistes', icon: <Megaphone className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_USERS) && hasModule('users')) {
      children.push({ id: 'users', label: 'Utilisateurs', href: '/users', icon: <UserCog className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_FAMILIES)) {
      children.push({ id: 'shepherd-families', label: 'Bergers & Familles', href: '/bergers', icon: <Users className="w-5 h-5" /> });
    }
    if (hasPermission(PERMISSIONS.MANAGE_SERVANTS) && hasModule('servants')) {
      children.push({ id: 'servants-admin', label: 'B.O.S.S', href: '/serviteurs', icon: <UsersRound className="w-5 h-5" /> });
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
  if (hasRole(ROLES.FAMILY_LEADER)) {
    const children: NavItem[] = [
      { id: 'family-souls', label: 'Membres de ma famille', href: '/ma-famille/ames', icon: <Heart className="w-5 h-5" /> },
      { id: 'family-shepherds', label: 'Bergers de ma famille', href: '/ma-famille/bergers', icon: <Users className="w-5 h-5" /> },
      { id: 'family-progression', label: 'Progression de ma famille', href: '/ma-famille/progression', icon: <TrendingUp className="w-5 h-5" /> },
    ];

    if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS)) {
      children.push(
        { id: 'family-interactions', label: 'Interactions de ma famille', href: '/interactions', icon: <MessageCircle className="w-5 h-5" /> },
        { id: 'family-reminders', label: 'Rappels', href: '/rappels', icon: <Bell className="w-5 h-5" /> }
      );
    }
    if (hasPermission(PERMISSIONS.MANAGE_SMS)) {
      children.push({ id: 'family-sms', label: 'SMS', href: '/sms', icon: <MessageSquare className="w-5 h-5" /> });
    }

    items.push({ id: 'family-management', label: 'Ma famille de service', icon: <UsersRound className="w-5 h-5" />, children });
  }

  // Admin tracking & interactions (pasteur : consultation du suivi)
  if (
    (hasPermission(PERMISSIONS.MANAGE_USERS) || hasRole(ROLES.PASTEUR)) &&
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

  // Statistics (admin + pasteur)
  if (
    hasPermission(PERMISSIONS.VIEW_STATS) &&
    (isAdmin || hasRole(ROLES.PASTEUR)) &&
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

  // Evangelist menu — groupé sous "Évangélisation" pour rester lisible en multi-casquettes
  if (hasRole(ROLES.EVANGELIST) && hasPermission(PERMISSIONS.MANAGE_EVANGELIZED_SOULS) && hasModule('evangelization')) {
    const children: NavItem[] = [];

    // Les admins/ADN ont déjà l'entrée "Âmes évangélisées" dans "Gestion des Âmes" : pas de doublon
    if (!isAdmin && !hasRole(ROLES.ADN)) {
      children.push({ id: 'evangelized-souls', label: 'Mes âmes évangélisées', icon: <Megaphone className="w-5 h-5" />, href: '/ames-evangelisees', dataTour: 'nav-evangelized-souls' });
    }
    children.push({ id: 'evangelist-relances', label: 'À relancer', icon: <Clock className="w-5 h-5" />, href: '/evangelisation/relances' });
    children.push({ id: 'evangelist-attendus', label: 'Attendus au culte', icon: <CalendarCheck className="w-5 h-5" />, href: '/evangelisation/attendus' });
    children.push({ id: 'evangelist-gagnees', label: 'Mes âmes gagnées', icon: <Trophy className="w-5 h-5" />, href: '/evangelisation/gagnees' });
    // Les bergers/responsables de famille/admins ont déjà une entrée Interactions ailleurs
    if (hasPermission(PERMISSIONS.MANAGE_INTERACTIONS) && !hasRole(ROLES.SHEPHERD) && !hasRole(ROLES.FAMILY_LEADER) && !isAdmin) {
      children.push({ id: 'evangelist-interactions', label: 'Mes interactions', icon: <MessageCircle className="w-5 h-5" />, href: '/interactions', dataTour: 'nav-interactions-evangelist' });
    }

    items.push({ id: 'evangelization', label: 'Évangélisation', icon: <Megaphone className="w-5 h-5" />, children });
  }

  // Organigramme de l'eglise : visible par tous
  items.push({ id: 'church-organization', label: 'Organisation', icon: <Network className="w-5 h-5" />, href: '/organisation' });

  // Academie VH AGC : espace etudiant visible par tous, gestion/parametres selon permission
  {
    const academieChildren: NavItem[] = [
      { id: 'academie-student', label: 'Mes cours', href: '/academie', icon: <GraduationCap className="w-5 h-5" /> },
    ];
    if (hasPermission(PERMISSIONS.MANAGE_ACADEMIE_CONTENT)) {
      academieChildren.push({ id: 'academie-gestion', label: 'Gestion des cours', href: '/academie/gestion', icon: <Settings className="w-5 h-5" /> });
    }
    if (isAdmin) {
      academieChildren.push({ id: 'academie-parametres', label: 'Classes & inscriptions', href: '/academie/parametres', icon: <UserCog className="w-5 h-5" /> });
    }
    items.push({ id: 'academie', label: 'Académie', icon: <GraduationCap className="w-5 h-5" />, children: academieChildren });
  }

  // Replay (not ADN)
  if (hasPermission(PERMISSIONS.VIEW_REPLAY_TEACHINGS) && !onlyRole(ROLES.ADN) && hasModule('audio')) {
    items.push({ id: 'replay-teachings-public', label: 'Replay des enseignements', icon: <Play className="w-5 h-5" />, href: '/replay' });
  }

  // Content & Communication (not ADN)
  if ((hasPermission(PERMISSIONS.MANAGE_AUDIO) || hasPermission(PERMISSIONS.MANAGE_SMS_TEMPLATES)) && !onlyRole(ROLES.ADN)) {
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
  if (hasPermission(PERMISSIONS.VIEW_STATS) && !onlyRole(ROLES.ADN) && (hasModule('soul_map') || hasModule('birthdays'))) {
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
  if (hasPermission(PERMISSIONS.MANAGE_CULTE_REPORTS) && (isAdmin || (!hasRole(ROLES.DEPARTMENT_LEADER) && !hasRole(ROLES.PASTEUR_ASSISTANT)))) {
    items.push({
      id: 'culte-reports',
      label: 'Rapports de culte',
      icon: <History className="w-5 h-5" />,
      children: [
        { id: 'culte-reports-dashboard', label: 'Tableau de bord', href: '/tableau-de-bord-rapports', icon: <LayoutDashboard className="w-5 h-5" /> },
        { id: 'culte-reports-worship', label: 'Gestion de Culte', href: '/rapports/worship', icon: <Presentation className="w-5 h-5" /> },
        { id: 'culte-reports-adn', label: 'ADN', href: '/rapports/adn', icon: <Users className="w-5 h-5" /> },
        { id: 'culte-reports-finance', label: 'Emmeraude', href: '/rapports/finance', icon: <Coins className="w-5 h-5" /> },
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
    if (hasPermission(PERMISSIONS.MANAGE_CULTE_REPORTS) && (isAdmin || (!hasRole(ROLES.DEPARTMENT_LEADER) && !hasRole(ROLES.PASTEUR_ASSISTANT)))) {
      children.push({ id: 'meeting-types', label: 'Types de rencontre', href: '/parametres-types-rencontre', icon: <CalendarDays className="w-5 h-5" /> });
      children.push({ id: 'speakers', label: 'Orateurs', href: '/parametres-orateurs', icon: <Mic className="w-5 h-5" /> });
      children.push({ id: 'recurring-schedule', label: 'Programme récurrent', href: '/parametres-programme-recurrent', icon: <CalendarRange className="w-5 h-5" /> });
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
