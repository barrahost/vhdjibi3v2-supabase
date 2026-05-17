import { Menu, X } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { getUserRole } from '../../utils/authUtils';
import { AccordionMenu } from './AccordionMenu';
import { Header } from './Header';
import Navigation from './Navigation';
import { Logo } from './Logo';
import { OfflineIndicator } from './OfflineIndicator';
import { OnboardingTour } from '../onboarding/OnboardingTour';
import { useOnboarding } from '../../hooks/useOnboarding';
import { BackToTop } from './BackToTop';
import { PWAInstallBanner } from './PWAInstallBanner';
import BugReportButton from './BugReportButton';
import { Footer } from './Footer';
import { SMSStatusBanner } from '../sms/SMSStatusBanner';

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isActive: isTourActive, currentStep, tourRole, advance, skip } = useOnboarding();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isShepherd, setIsShepherd] = useState(false);
  const [isADN, setIsADN] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkUserRole = async () => {
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = localUser.id;
      if (!userId) return;
      const { isAdmin: adminRole, isShepherd: shepherdRole, isADN: adnRole } = await getUserRole(userId);
      setIsAdmin(adminRole);
      setIsShepherd(shepherdRole);
      setIsADN(adnRole);
    };

    checkUserRole();
  }, [user]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <Logo className="h-8 w-auto" />
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      <div className="flex flex-1">
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-20"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 left-0
          w-64 bg-white border-r
          transform transition-transform duration-200 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
          z-30 lg:z-auto
          flex flex-col
          h-full
        `}>
          {/* Logo and Navigation container with scroll */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Logo section - fixed */}
            <div className="p-6 hidden lg:block">
              <Logo className="h-12 w-auto" />
            </div>

            {/* Navigation section - scrollable */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <Navigation
                onItemClick={() => setIsMobileMenuOpen(false)}
              />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          <Header />
          <SMSStatusBanner />
          <div className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>

      {/* Offline indicator */}
      <OfflineIndicator />
      <BackToTop />
      <PWAInstallBanner />
      <BugReportButton />

      {/* Tour d'onboarding */}
      {isTourActive && tourRole && (
        <OnboardingTour
          role={tourRole}
          step={currentStep}
          onAdvance={advance}
          onSkip={skip}
        />
      )}
    </div>
  );
}