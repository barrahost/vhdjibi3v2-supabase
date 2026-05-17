import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import UndecidedSouls from './pages/UndecidedSouls';
import { UserProfileProvider } from './contexts/UserProfileContext';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { CookieBanner } from './components/gdpr/CookieBanner';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { FeatureAnnouncementModal } from './components/announcements/FeatureAnnouncementModal';
import { PERMISSIONS } from './constants/roles';
import PrivateRoute from './components/auth/PrivateRoute';
import Layout from './components/ui/Layout';
import AttendanceView from './pages/AttendanceView';
import StatistiquesAdmin from './pages/StatistiquesAdmin';
import ServantManagement from './pages/ServantManagement';

// Lazy load components
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SoulManagement = lazy(() => import('./pages/SoulManagement'));
const EvangelizedSoulManagement = lazy(() => import('./pages/EvangelizedSoulManagement'));
const InteractionsManagement = lazy(() => import('./pages/InteractionsManagement'));
const AssignedSouls = lazy(() => import('./pages/AssignedSouls'));
const AttendanceManagement = lazy(() => import('./pages/AttendanceManagement'));
const Reminders = lazy(() => import('./pages/Reminders'));
const Settings = lazy(() => import('./pages/Settings'));
const DepartmentManagement = lazy(() => import('./pages/DepartmentManagement'));
const ServiceFamilyManagement = lazy(() => import('./pages/ServiceFamilyManagement'));
const SpiritualProgression = lazy(() => import('./pages/SpiritualProgression'));
const ShepherdReminders = lazy(() => import('./pages/ShepherdReminders'));
const SMSManagement = lazy(() => import('./pages/SMSManagement'));
const SMSTemplatesManagement = lazy(() => import('./pages/SMSTemplatesManagement'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const SoulMapPage = lazy(() => import('./pages/SoulMap'));
const LegalNotice = lazy(() => import('./pages/LegalNotice'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const BirthdayForm = lazy(() => import('./pages/BirthdayForm'));
const BirthdayList = lazy(() => import('./pages/BirthdayList'));
const BirthdayConfirmation = lazy(() => import('./pages/BirthdayConfirmation'));
const ReplayTeachings = lazy(() => import('./pages/ReplayTeachings'));
const AudioManagement = lazy(() => import('./pages/AudioManagement'));
const SyncDepartmentLeaders = lazy(() => import('./pages/SyncDepartmentLeaders'));

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

  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <CookieBanner />
      {user && (
        <UserProfileModal />
      )}
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<PageLoader />}>
            <FeatureAnnouncementModal />
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
        <Route path="/" element={
          <PrivateRoute>
            <Suspense fallback={<PageLoader />}>
              <Layout />
            </Suspense>
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="/ames-indecises" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SOULS]}>
              <UndecidedSouls />
            </PrivateRoute>
          } />
          
          {/* English route for undecided souls */}
          <Route path="/undecided-souls" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SOULS]}>
              <UndecidedSouls />
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
              <SoulManagement />
            </PrivateRoute>
          } />

          {/* English route for backwards compatibility with dashboard links */}
          <Route path="souls" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_SOULS]}>
              <SoulManagement />
            </PrivateRoute>
          } />

          {/* Gestion des âmes évangélisées (profil Évangéliste) */}
          <Route path="ames-evangelisees" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
              <EvangelizedSoulManagement />
            </PrivateRoute>
          } />
          <Route path="evangelized-souls" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_EVANGELIZED_SOULS]}>
              <EvangelizedSoulManagement />
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

          {/* Synchronisation des responsables de département */}
          <Route path="/sync-department-leaders" element={
            <PrivateRoute requiredPermissions={[PERMISSIONS.MANAGE_USERS]}>
              <SyncDepartmentLeaders />
            </PrivateRoute>
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
      <BrowserRouter>
        <AuthProvider>
          <UserProfileProvider>
          <OnboardingProvider>
            <AppContent />
          </OnboardingProvider>
          </UserProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}