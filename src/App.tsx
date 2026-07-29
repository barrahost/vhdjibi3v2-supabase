import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { useChurch } from './contexts/ChurchContext';
import ChurchNotFound from './pages/ChurchNotFound';
import { ChurchProvider } from './contexts/ChurchContext';
import { useAuth } from './contexts/AuthContext';
import { UserProfileProvider } from './contexts/UserProfileContext';

import { CookieBanner } from './components/gdpr/CookieBanner';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { PERMISSIONS } from './constants/roles';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/ui/Layout';
import AttendanceView from './pages/AttendanceView';
import StatistiquesAdmin from './pages/StatistiquesAdmin';
import ServantManagement from './pages/ServantManagement';

// Lazy load components
const FamilyLeaderDashboard = lazy(() => import('./components/dashboard/FamilyLeaderDashboard'));
const FamilyShepherdsPage = lazy(() => import('./pages/FamilyShepherdsPage'));
const FamilyProgressionPage = lazy(() => import('./pages/FamilyProgressionPage'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SoulsHub = lazy(() => import('./pages/SoulsHub'));
const EvangelistRelances = lazy(() => import('./pages/EvangelistRelances'));
const EvangelistAttendus = lazy(() => import('./pages/EvangelistAttendus'));
const EvangelizedSignals = lazy(() => import('./pages/EvangelizedSignals'));
const InteractionsManagement = lazy(() => import('./pages/InteractionsManagement'));
const AssignedSouls = lazy(() => import('./pages/AssignedSouls'));
const AttendanceManagement = lazy(() => import('./pages/AttendanceManagement'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Settings = lazy(() => import('./pages/Settings'));
const DepartmentManagement = lazy(() => import('./pages/DepartmentManagement'));
const ServiceFamilyManagement = lazy(() => import('./pages/ServiceFamilyManagement'));
const ShepherdFamilyManagement = lazy(() => import('./pages/ShepherdFamilyManagement'));
const CulteReportForm = lazy(() => import('./pages/CulteReportForm'));
const CulteNeedsManagement = lazy(() => import('./pages/CulteNeedsManagement'));
const CulteReportsDashboard = lazy(() => import('./pages/CulteReportsDashboard'));
const CulteReportDepartmentView = lazy(() => import('./pages/CulteReportDepartmentView'));

/** Remonte CulteReportDepartmentView a chaque changement de type de rapport, sinon React reutilise
 * l'instance existante et des etats internes (mode d'agregation, periode...) fuient d'un type a l'autre
 * (ex: le mode "Par mois" de Finance restait actif en passant sur Sainte Cene, faussant son graphique). */
function CulteReportDepartmentViewRoute() {
  const { reportType } = useParams<{ reportType: string }>();
  return <CulteReportDepartmentView key={reportType} />;
}
const MeetingTypeSettings = lazy(() => import('./pages/MeetingTypeSettings'));
const SpeakerSettings = lazy(() => import('./pages/SpeakerSettings'));
const RecurringScheduleSettings = lazy(() => import('./pages/RecurringScheduleSettings'));
const SpiritualProgression = lazy(() => import('./pages/SpiritualProgression'));
const ShepherdReminders = lazy(() => import('./pages/ShepherdReminders'));
const SMSManagement = lazy(() => import('./pages/SMSManagement'));
const SMSTemplatesManagement = lazy(() => import('./pages/SMSTemplatesManagement'));
const BugReports = lazy(() => import('./pages/BugReports'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SoulMapPage = lazy(() => import('./pages/SoulMap'));
const LegalNotice = lazy(() => import('./pages/LegalNotice'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const BirthdayForm = lazy(() => import('./pages/BirthdayForm'));
const BirthdayList = lazy(() => import('./pages/BirthdayList'));
const BirthdayConfirmation = lazy(() => import('./pages/BirthdayConfirmation'));
const ReplayTeachings = lazy(() => import('./pages/ReplayTeachings'));
const AudioManagement = lazy(() => import('./pages/AudioManagement'));
const ChurchesManagement = lazy(() => import('./pages/ChurchesManagement'));
const ShepherdConfirmation = lazy(() => import('./pages/ShepherdConfirmation'));
const LeaveRequestForm = lazy(() => import('./pages/LeaveRequestForm'));
const LeaveManagement = lazy(() => import('./pages/LeaveManagement'));
const PrayerRequestForm = lazy(() => import('./pages/PrayerRequestForm'));
const EvangelizationForm = lazy(() => import('./pages/EvangelizationForm'));
const PrayerRequestsManagement = lazy(() => import('./pages/PrayerRequestsManagement'));

// Loading component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00665C]"></div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const { church, loading: churchLoading, isSuperAdminDomain } = useChurch();

  if (loading || churchLoading) {
    return <PageLoader />;
  }

  // If not super admin domain and church not found, show error page
  const hostname = window.location.hostname;
  const isLocalDev = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  if (!isSuperAdminDomain && !isLocalDev && !church) {
    const slug = hostname.split('.')[0];
    return <ChurchNotFound slug={slug} />;
  }
  
  // On super admin domain, only super_admin can access
  // Other roles see an access denied page (handled per-route via PrivateRoute)

  return (
    <>
      <CookieBanner />
      {user && (
        <UserProfileModal />
      )}
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <Login />
          </Suspense>
        } />
        <Route path="/legal-notice" element={
          <Suspense fallback={<PageLoader />}>
            <LegalNotice />
          </Suspense>
        } />
        <Route path="/privacy-policy" element={
          <Suspense fallback={<PageLoader />}>
            <PrivacyPolicy />
          </Suspense>
        } />
        <Route path="/replay" element={
          <Suspense fallback={<PageLoader />}>
              <ReplayTeachings />
          </Suspense>
        } />
        <Route path="/anniversaires/ajouter" element={
          <Suspense fallback={<PageLoader />}>
            <BirthdayForm />
          </Suspense>
        } />
        <Route path="/anniversaires/merci" element={
          <Suspense fallback={<PageLoader />}>
            <BirthdayConfirmation />
          </Suspense>
        } />
        <Route path="/confirm/:token" element={
          <Suspense fallback={<PageLoader />}>
            <ShepherdConfirmation />
          </Suspense>
        } />
        <Route path="/absence" element={
          <Suspense fallback={<PageLoader />}>
            <LeaveRequestForm />
          </Suspense>
        } />
        <Route path="/conge" element={<Navigate to="/absence" replace />} />

        <Route path="/priere" element={
          <Suspense fallback={<PageLoader />}>
            <PrayerRequestForm />
          </Suspense>
        } />
        <Route path="/evangelisation" element={
          <Suspense fallback={<PageLoader />}>
            <EvangelizationForm />
          </Suspense>
        } />
        <Route path="/" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <Layout />
            </Suspense>
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="/ma-famille/ames" element={<FamilyLeaderDashboard />} />
          <Route path="/ma-famille/bergers" element={<FamilyShepherdsPage />} />
          <Route path="/ma-famille/progression" element={<FamilyProgressionPage />} />
          <Route path="/ames-indecises" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SOULS]}>
              <SoulsHub defaultTab="undecided" />
            </PrivateRoute>
          } />

          {/* English route for undecided souls */}
          <Route path="/undecided-souls" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SOULS]}>
              <SoulsHub defaultTab="undecided" />
            </PrivateRoute>
          } />
          
          {/* Gestion des utilisateurs */}
          <Route path="users" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_USERS]}>
              <UserManagement />
            </PrivateRoute>
          } />

          {/* Gestion des âmes */}
          <Route path="ames" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SOULS]}>
              <SoulsHub defaultTab="all" />
            </PrivateRoute>
          } />

          {/* English route for backwards compatibility with dashboard links */}
          <Route path="souls" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SOULS]}>
              <SoulsHub defaultTab="all" />
            </PrivateRoute>
          } />

          {/* Gestion des âmes évangélisées (profil Évangéliste) */}
          <Route path="ames-evangelisees" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
              <SoulsHub defaultTab="evangelized" />
            </PrivateRoute>
          } />
          <Route path="evangelized-souls" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
              <SoulsHub defaultTab="evangelized" />
            </PrivateRoute>
          } />

          {/* Suivi Évangéliste : relances prioritaires + pointage des attendus au culte */}
          <Route path="evangelisation/relances" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
              <EvangelistRelances />
            </PrivateRoute>
          } />
          <Route path="evangelisation/attendus" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
              <EvangelistAttendus />
            </PrivateRoute>
          } />
          <Route path="signalements-evangelistes" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
              <EvangelizedSignals />
            </PrivateRoute>
          } />

          {/* Gestion des interactions */}
          <Route path="interactions" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_INTERACTIONS]}>
              <InteractionsManagement />
            </PrivateRoute>
          } />

          {/* Âmes assignées (pour les bergers) */}
          <Route path="assigned-souls" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_INTERACTIONS]}>
              <AssignedSouls />
            </PrivateRoute>
          } />
          
          {/* French route for backwards compatibility */}
          <Route path="ames-assignees" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_INTERACTIONS]}>
              <AssignedSouls />
            </PrivateRoute>
          } />

          {/* Gestion des présences */}
          <Route path="presences" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_ATTENDANCES]}>
              <AttendanceManagement />
            </PrivateRoute>
          } />
          
          {/* English route for attendance */}
          <Route path="attendance" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_ATTENDANCES]}>
              <AttendanceManagement />
            </PrivateRoute>
          } />

          <Route path="/historique-presences" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <AttendanceView />
            </PrivateRoute>
          } />

          <Route path="statistiques" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <StatistiquesAdmin />
            </PrivateRoute>
          } />

          {/* Rappels */}
          <Route path="rappels" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_INTERACTIONS]}>
              <Reminders />
            </PrivateRoute>
          } />

          {/* Gestion des départements */}
          <Route path="departements" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_DEPARTMENTS]}>
              <DepartmentManagement />
            </PrivateRoute>
          } />

          {/* Gestion des serviteurs */}
          <Route path="serviteurs" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SERVANTS, PERMISSIONS.MANAGE_DEPARTMENT_SERVANTS]}>
              <ServantManagement />
            </PrivateRoute>
          } />

          {/* Gestion des familles de service */}
          <Route path="familles" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_DEPARTMENTS]}>
              <ServiceFamilyManagement />
            </PrivateRoute>
          } />

          {/* Répartition des bergers dans les familles */}
          <Route path="bergers" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_FAMILIES]}>
              <ShepherdFamilyManagement />
            </PrivateRoute>
          } />

          {/* Progression spirituelle */}
          <Route path="spiritual-progression" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <SpiritualProgression />
            </PrivateRoute>
          } />
          <Route path="birthdays" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <BirthdayList />
            </PrivateRoute>
          } />
          <Route path="anniversaires" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <BirthdayList />
            </PrivateRoute>
          } />

          {/* Carte des âmes */}
          <Route path="carte" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <SoulMapPage />
            </PrivateRoute>
          } />
          
          {/* English route for soul map */}
          <Route path="soul-map" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <SoulMapPage />
            </PrivateRoute>
          } />

          {/* Rappels des bergers */}
          <Route path="rappels-bergers" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <ShepherdReminders />
            </PrivateRoute>
          } />
          
          {/* English route for shepherd reminders */}
          <Route path="shepherd-reminders" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.VIEW_STATS]}>
              <ShepherdReminders />
            </PrivateRoute>
          } />

          {/* Gestion des SMS */}
          <Route path="sms" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SMS]}>
              <SMSManagement />
            </PrivateRoute>
          } />

          {/* Gestion des modèles SMS */}
          <Route path="modeles-sms" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SMS_TEMPLATES]}>
              <SMSTemplatesManagement />
            </PrivateRoute>
          } />

          {/* Paramètres */}
          <Route path="parametres" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_PROFILE]}>
              <Settings />
            </PrivateRoute>
          } />

          <Route path="/audio" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_AUDIO]}>
              <AudioManagement />
            </PrivateRoute>
          } />

          {/* Bug Reports */}
          <Route path="bug-reports" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SETTINGS]}>
              <BugReports />
            </PrivateRoute>
          } />

          {/* Absences (congés + absences courtes) */}
          <Route path="absences" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_LEAVES]}>
              <Suspense fallback={<PageLoader />}>
                <LeaveManagement />
              </Suspense>
            </PrivateRoute>
          } />
          <Route path="conges" element={<Navigate to="/absences" replace />} />

          {/* Chaîne de prière */}
          <Route path="prieres" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_PRAYER_REQUESTS]}>
              <Suspense fallback={<PageLoader />}>
                <PrayerRequestsManagement />
              </Suspense>
            </PrivateRoute>
          } />

          {/* Rapports de culte */}
          <Route path="tableau-de-bord-rapports" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_CULTE_REPORTS]}>
              <CulteReportsDashboard />
            </PrivateRoute>
          } />
          <Route path="rapport-culte" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_CULTE_REPORTS]}>
              <CulteReportForm />
            </PrivateRoute>
          } />
          <Route path="besoins-rapports" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_CULTE_REPORTS]}>
              <CulteNeedsManagement />
            </PrivateRoute>
          } />
          <Route path="rapports/:reportType" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_CULTE_REPORTS]}>
              <CulteReportDepartmentViewRoute />
            </PrivateRoute>
          } />
          <Route path="parametres-types-rencontre" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_CULTE_REPORTS]}>
              <MeetingTypeSettings />
            </PrivateRoute>
          } />
          <Route path="parametres-orateurs" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_CULTE_REPORTS]}>
              <SpeakerSettings />
            </PrivateRoute>
          } />
          <Route path="parametres-programme-recurrent" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_CULTE_REPORTS]}>
              <RecurringScheduleSettings />
            </PrivateRoute>
          } />

          {/* Gestion des églises — super admin central uniquement */}
          <Route path="churches" element={
            <ChurchesManagement />
          } />

          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ChurchProvider>
      <BrowserRouter>
        <AuthProvider>
          <UserProfileProvider>

            <AppContent />

          </UserProfileProvider>
        </AuthProvider>
      </BrowserRouter>
      </ChurchProvider>
    </QueryClientProvider>
  );
}