import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AdminAlert {
  type: 'no_shepherd' | 'undecided' | 'pending_evangelized' | 'no_family' | 'upcoming_birthday';
  count: number;
  souls?: { id: string; name: string; detail?: string }[];
  navigateTo?: string;
}

export interface AdminNotificationsResult {
  alerts: AdminAlert[];
  totalCount: number;
  loading: boolean;
  refresh: () => void;
}

export function useAdminNotifications(): AdminNotificationsResult {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    let cancelled = false;

    async function fetchAlerts() {
      setLoading(true);
      try {
        const newAlerts: AdminAlert[] = [];

        // 1. Âmes sans berger
        const noShepherdSnap = await getDocs(query(
          collection(db, 'souls'),
          where('status', '==', 'active'),
          where('shepherdId', '==', '')
        ));
        // Also catch souls where shepherdId is missing/null
        const noShepherdSnap2 = await getDocs(query(
          collection(db, 'souls'),
          where('status', '==', 'active')
        ));
        const allActiveSouls = noShepherdSnap2.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const soulsWithoutShepherd = allActiveSouls.filter(
          (s: any) => !s.shepherdId || s.shepherdId === ''
        );

        if (soulsWithoutShepherd.length > 0) {
          newAlerts.push({
            type: 'no_shepherd',
            count: soulsWithoutShepherd.length,
            souls: soulsWithoutShepherd.slice(0, 5).map((s: any) => ({
              id: s.id,
              name: s.fullName,
            })),
            navigateTo: '/gestion-des-ames',
          });
        }

        // 2. Âmes indécises
        const undecidedSouls = allActiveSouls.filter((s: any) => s.isUndecided === true);
        if (undecidedSouls.length > 0) {
          newAlerts.push({
            type: 'undecided',
            count: undecidedSouls.length,
            souls: undecidedSouls.slice(0, 5).map((s: any) => ({
              id: s.id,
              name: s.fullName,
            })),
            navigateTo: '/gestion-des-ames',
          });
        }

        // 3. Âmes évangélisées en attente (non reçues)
        const pendingEvangelizedSnap = await getDocs(query(
          collection(db, 'evangelized_souls'),
          where('status', '!=', 'imported')
        ));
        const pendingEvangelized = pendingEvangelizedSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as any))
          .filter((s: any) => !s.importedToSoulId);

        if (pendingEvangelized.length > 0) {
          newAlerts.push({
            type: 'pending_evangelized',
            count: pendingEvangelized.length,
            souls: pendingEvangelized.slice(0, 5).map((s: any) => ({
              id: s.id,
              name: s.fullName,
            })),
            navigateTo: '/ames-evangelisees',
          });
        }

        // 4. Âmes sans famille de service
        const soulsWithoutFamily = allActiveSouls.filter(
          (s: any) => !s.serviceFamilyId || s.serviceFamilyId === ''
        );
        if (soulsWithoutFamily.length > 0) {
          newAlerts.push({
            type: 'no_family',
            count: soulsWithoutFamily.length,
            souls: soulsWithoutFamily.slice(0, 5).map((s: any) => ({
              id: s.id,
              name: s.fullName,
            })),
            navigateTo: '/gestion-des-ames',
          });
        }

        // 5. Anniversaires dans les 7 prochains jours
        const today = new Date();
        const in7Days = new Date(today);
        in7Days.setDate(today.getDate() + 7);

        const soulsBirthday = allActiveSouls.filter((s: any) => {
          if (!s.birthDate) return false;
          try {
            const bDate = s.birthDate?.toDate ? s.birthDate.toDate() : new Date(s.birthDate);
            const thisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
            const diff = Math.floor((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diff >= 0 && diff <= 7;
          } catch {
            return false;
          }
        });

        if (soulsBirthday.length > 0) {
          newAlerts.push({
            type: 'upcoming_birthday',
            count: soulsBirthday.length,
            souls: soulsBirthday.slice(0, 5).map((s: any) => {
              const bDate = s.birthDate?.toDate ? s.birthDate.toDate() : new Date(s.birthDate);
              const thisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
              const diff = Math.floor((thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              return {
                id: s.id,
                name: s.fullName,
                detail: diff === 0 ? "Aujourd'hui !" : `Dans ${diff} jour${diff > 1 ? 's' : ''}`,
              };
            }),
            navigateTo: '/outils/anniversaires',
          });
        }

        if (!cancelled) {
          setAlerts(newAlerts);
          setTotalCount(newAlerts.reduce((sum, a) => sum + a.count, 0));
          setLoading(false);
        }
      } catch (err) {
        console.error('useAdminNotifications error:', err);
        if (!cancelled) setLoading(false);
      }
    }

    fetchAlerts();

    // Rafraîchissement automatique toutes les 5 minutes
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tick]);

  return { alerts, totalCount, loading, refresh };
}
