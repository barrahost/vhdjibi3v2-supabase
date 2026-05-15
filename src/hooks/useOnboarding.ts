import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type TourRole = 'evangelist' | 'shepherd';

const TOUR_ROLES: string[] = ['evangelist', 'shepherd'];

function storageKey(role: TourRole, userId: string) {
  return `onboarding_done_${role}_${userId}`;
}

export function useOnboarding() {
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
      // Légère temporisation pour laisser le DOM se stabiliser
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
    if (!user || !tourRole) return;
    const userId = (user as any).id || (user as any).uid || 'anon';
    localStorage.setItem(storageKey(tourRole, userId), 'true');
    setIsActive(false);
    setCurrentStep(0);
  };

  const restart = () => {
    if (!user || !tourRole) return;
    const userId = (user as any).id || (user as any).uid || 'anon';
    localStorage.removeItem(storageKey(tourRole, userId));
    setCurrentStep(0);
    setIsActive(true);
  };

  return { isActive, currentStep, tourRole, advance, complete, skip: complete, restart };
}
