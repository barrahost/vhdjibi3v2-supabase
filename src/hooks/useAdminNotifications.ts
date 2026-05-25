import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getChurchId } from '../lib/churchId';

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

        // 1. Toutes les âmes actives (une seule requête pour tout)
        const { data: allSouls, error: soulsErr } = await supabase
          .from('souls')
          .select('id, full_name, shepherd_id, is_undecided, service_family_id, status')
          .eq('church_id', getChurchId());

        if (soulsErr) throw soulsErr;
        const activeSouls = (allSouls || []).filter((s: any) => s.status === 'active');

        // 2. Âmes sans berger
        const soulsWithoutShepherd = activeSouls.filter(
          (s: any) => !s.shepherd_id || s.shepherd_id === ''
        );
        if (soulsWithoutShepherd.length > 0) {
          newAlerts.push({
            type: 'no_shepherd',
            count: soulsWithoutShepherd.length,
            souls: soulsWithoutShepherd.slice(0, 5).map((s: any) => ({ id: s.id, name: s.full_name })),
            navigateTo: '/gestion-des-ames',
          });
        }

        // 3. Âmes indécises
        const undecidedSouls = activeSouls.filter((s: any) => s.is_undecided === true);
        if (undecidedSouls.length > 0) {
          newAlerts.push({
            type: 'undecided',
            count: undecidedSouls.length,
            souls: undecidedSouls.slice(0, 5).map((s: any) => ({ id: s.id, name: s.full_name })),
            navigateTo: '/gestion-des-ames',
          });
        }

        // 4. Âmes sans famille de service
        const soulsWithoutFamily = activeSouls.filter(
          (s: any) => !s.service_family_id || s.service_family_id === ''
        );
        if (soulsWithoutFamily.length > 0) {
          newAlerts.push({
            type: 'no_family',
            count: soulsWithoutFamily.length,
            souls: soulsWithoutFamily.slice(0, 5).map((s: any) => ({ id: s.id, name: s.full_name })),
            navigateTo: '/gestion-des-ames',
          });
        }

        // 5. Âmes évangélisées en attente (non importées)
        const { data: evangelizedData, error: evangErr } = await supabase
          .from('evangelized_souls')
          .select('id, full_name, status, imported_to_soul_id')
          .eq('church_id', getChurchId())
          .neq('status', 'imported');

        if (evangErr) throw evangErr;
        const pendingEvangelized = (evangelizedData || []).filter((s: any) => !s.imported_to_soul_id);
        if (pendingEvangelized.length > 0) {
          newAlerts.push({
            type: 'pending_evangelized',
            count: pendingEvangelized.length,
            souls: pendingEvangelized.slice(0, 5).map((s: any) => ({ id: s.id, name: s.full_name })),
            navigateTo: '/ames-evangelisees',
          });
        }

        // 6. Anniversaires dans les 7 prochains jours (table birthdays)
        const { data: birthdaysData, error: bdErr } = await supabase
          .from('birthdays')
          .select('id, full_name, birth_date, soul_id')
          .eq('church_id', getChurchId());

        if (!bdErr && birthdaysData) {
          const today = new Date();
          const upcomingBirthdays = birthdaysData.filter((b: any) => {
            if (!b.birth_date) return false;
            try {
              const bDate = new Date(b.birth_date);
              const thisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
              const diff = Math.floor(
                (thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              );
              return diff >= 0 && diff <= 7;
            } catch {
              return false;
            }
          });

          if (upcomingBirthdays.length > 0) {
            newAlerts.push({
              type: 'upcoming_birthday',
              count: upcomingBirthdays.length,
              souls: upcomingBirthdays.slice(0, 5).map((b: any) => {
                const bDate = new Date(b.birth_date);
                const thisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
                const diff = Math.floor(
                  (thisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                );
                return {
                  id: b.soul_id || b.id,
                  name: b.full_name,
                  detail: diff === 0 ? "Aujourd'hui !" : `Dans ${diff} jour${diff > 1 ? 's' : ''}`,
                };
              }),
              navigateTo: '/outils/anniversaires',
            });
          }
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
