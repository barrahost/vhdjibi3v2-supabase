import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type TourRole = 'evangelist' | 'shepherd';

const TOUR_ROLES: string[] = ['evangelist', 'shepherd'];

function storageKey(role: TourRole, userId: string) {
  return `onboarding_done_${role}_${userId}`;
}

interface OnboardingContextValue {
  isActive: boolean;
  currentStep: number;
  tourRole: TourRole | null;
  advance: () => void;
  complete: () => void;
  skip: () => void;
  restart: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, activeRole } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tourRole, setTourRole] = useState<TourRole | null>(null);

  useEffect(() => {
    if (!user || !activeRole) return;
    const role = activeRole as string;
    if (!TOUR_ROLES.includes(role)) return;

    const userId = (user as any).id || (user as any).uid || 'anon';
    const key = storageKey(role as TourRole, userId);

    if (!localStorage.getItem(key)) {
      // Mark as seen IMMEDIATELY so it won't show again even if user closes tab
      localStorage.setItem(key, 'true');

      const t = setTimeout(() => {
        setTourRole(role as TourRole);
        setCurrentStep(0);
        setIsActive(true);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [user, activeRole]);

  const advance = () => setCurrentStep(s => s + 1);

  const complete = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const restart = () => {
    if (!user || !activeRole) return;
    const role = activeRole as string;
    if (!TOUR_ROLES.includes(role)) return;
    const userId = (user as any).id || (user as any).uid || 'anon';
    localStorage.removeItem(storageKey(role as TourRole, userId));
    setTourRole(role as TourRole);
    setCurrentStep(0);
    setIsActive(true);
  };

  return (
    <OnboardingContext.Provider value={{ isActive, currentStep, tourRole, advance, complete, skip: complete, restart }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboardingContext must be used inside OnboardingProvider');
  return ctx;
}
