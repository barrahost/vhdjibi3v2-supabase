import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Header } from './Header';
import Navigation from './Navigation';
import { Logo } from './Logo';
import { Footer } from './Footer';
import { OfflineIndicator } from './OfflineIndicator';
import { BackToTop } from './BackToTop';
import { PWAInstallBanner } from './PWAInstallBanner';
import BugReportButton from './BugReportButton';
import { MobileBottomNav } from './MobileBottomNav';
import { SMSStatusBanner } from '../sms/SMSStatusBanner';

export default function Layout() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar — fixed, desktop only */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-20">
        <div className="p-6 flex-shrink-0">
          <Logo className="h-16 w-auto" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <Navigation />
        </div>
      </aside>

      {/* Main content — offset on desktop for sidebar */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header />
        <SMSStatusBanner />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
        <Footer className="hidden lg:block" />
      </div>

      {/* Mobile bottom navigation (renders outside sidebar, fixed to viewport) */}
      <MobileBottomNav />

      {/* Utility overlays */}
      <OfflineIndicator />
      <BackToTop />
      <PWAInstallBanner />
      <BugReportButton />

    </div>
  );
}
