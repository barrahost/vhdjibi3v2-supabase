import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  ListTodo,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from 'lucide-react';

type Props =
  | { role: 'adn' }
  | { role: 'family_leader'; familyId: string }
  | { role: 'shepherd'; shepherdId: string };

interface Action {
  id: string;
  count: number;
  label: string;
  onClick?: () => void;
  ctaLabel?: string;
}

export default function PendingActionsWidget(props: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<Action[]>([]);

  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      try {
        setLoading(true);
        const next: Action[] = [];

        if (props.role === 'adn') {
          const snap = await getDocs(
            query(collection(db, 'souls'), where('status', '==', 'active'))
          );
          let noFamily = 0;
          let undecided = 0;
          snap.docs.forEach((d) => {
            const data = d.data() as any;
            if (data.isUndecided) undecided++;
            else if (!data.serviceFamilyId) noFamily++;
          });

          next.push({
            id: 'no-family',
            count: noFamily,
            label:
              noFamily > 1
                ? `${noFamily} âmes sans famille assignée`
                : `${noFamily} âme sans famille assignée`,
            onClick: () => navigate('/souls?filter=unassigned_family'),
            ctaLabel: 'Voir',
          });
          next.push({
            id: 'undecided',
            count: undecided,
            label:
              undecided > 1
                ? `${undecided} âmes indécises à recontacter`
                : `${undecided} âme indécise à recontacter`,
            onClick: () => navigate('/undecided-souls'),
            ctaLabel: 'Voir',
          });
        } else if (props.role === 'family_leader') {
          const snap = await getDocs(
            query(
              collection(db, 'souls'),
              where('serviceFamilyId', '==', props.familyId)
            )
          );
          const noShepherd = snap.docs.filter((d) => {
            const data = d.data() as any;
            return !data.shepherdId && data.status !== 'inactive';
          }).length;

          next.push({
            id: 'no-shepherd',
            count: noShepherd,
            label:
              noShepherd > 1
                ? `${noShepherd} âmes sans berger dans ta famille`
                : `${noShepherd} âme sans berger dans ta famille`,
          });
        } else if (props.role === 'shepherd') {
          const [soulsSnap, interactionsSnap] = await Promise.all([
            getDocs(
              query(
                collection(db, 'souls'),
                where('shepherdId', '==', props.shepherdId),
                where('status', '==', 'active')
              )
            ),
            getDocs(
              query(
                collection(db, 'interactions'),
                where('shepherdId', '==', props.shepherdId)
              )
            ),
          ]);
          const lastBySoul = new Map<string, number>();
          interactionsSnap.docs.forEach((d) => {
            const data = d.data() as any;
            const t = data.date?.toDate ? data.date.toDate().getTime() : 0;
            const sid = data.soulId;
            if (!sid) return;
            if (!lastBySoul.has(sid) || lastBySoul.get(sid)! < t) {
              lastBySoul.set(sid, t);
            }
          });
          const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
          const stale = soulsSnap.docs.filter((d) => {
            const last = lastBySoul.get(d.id);
            return !last || last < cutoff;
          }).length;

          next.push({
            id: 'stale-contact',
            count: stale,
            label:
              stale > 1
                ? `${stale} âmes sans contact depuis plus de 14 jours`
                : `${stale} âme sans contact depuis plus de 14 jours`,
            onClick: () => navigate('/assigned-souls'),
            ctaLabel: 'Voir',
          });
        }

        if (!cancelled) setActions(next);
      } catch (e) {
        console.error('PendingActionsWidget error:', e);
        if (!cancelled) setActions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    compute();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.role,
    (props as any).familyId,
    (props as any).shepherdId,
  ]);

  const visible = actions.filter((a) => a.count > 0);
  const allClear = !loading && visible.length === 0;

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
        <ListTodo className="w-4 h-4 text-[#00665C]" />
        <h2 className="font-semibold text-gray-900">Actions en attente</h2>
      </div>

      <div className="divide-y">
        {loading ? (
          <div className="px-4 py-4 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Calcul en cours…
          </div>
        ) : allClear ? (
          <div className="px-4 py-4 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            Tout est à jour, beau travail !
          </div>
        ) : (
          visible.map((a) => (
            <div
              key={a.id}
              className="px-4 py-3 flex items-center gap-3 text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span className="flex-1 text-gray-800">{a.label}</span>
              {a.onClick && (
                <button
                  type="button"
                  onClick={a.onClick}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#00665C] hover:bg-[#00665C]/10 border border-[#00665C] rounded"
                >
                  {a.ctaLabel || 'Voir'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
