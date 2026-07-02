import { useNavigate } from 'react-router-dom';
import {
  Bell, Users, HelpCircle, Heart, Home, Cake,
  ChevronRight, RefreshCw
} from 'lucide-react';
import type { AdminAlert } from '../../hooks/useAdminNotifications';

interface Props {
  alerts: AdminAlert[];
  loading: boolean;
  onRefresh: () => void;
  onNavigate: () => void; // appelé avant de naviguer, pour fermer la modale
}

const ALERT_CONFIG: Record<AdminAlert['type'], {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  description: (count: number) => string;
}> = {
  no_shepherd: {
    label: 'Sans berger',
    icon: <Users className="w-4 h-4" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: (n) => `${n} âme${n > 1 ? 's' : ''} sans berger attitré`,
  },
  undecided: {
    label: 'Indécises',
    icon: <HelpCircle className="w-4 h-4" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: (n) => `${n} âme${n > 1 ? 's' : ''} indécise${n > 1 ? 's' : ''} à suivre`,
  },
  pending_evangelized: {
    label: 'Évangélisées en attente',
    icon: <Heart className="w-4 h-4" />,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: (n) => `${n} âme${n > 1 ? 's' : ''} évangélisée${n > 1 ? 's' : ''} en attente de réception`,
  },
  no_family: {
    label: 'Sans famille',
    icon: <Home className="w-4 h-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: (n) => `${n} âme${n > 1 ? 's' : ''} sans famille de service`,
  },
  upcoming_birthday: {
    label: 'Anniversaires',
    icon: <Cake className="w-4 h-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: (n) => `${n} anniversaire${n > 1 ? 's' : ''} dans les 7 prochains jours`,
  },
};

export default function AdminAlertsContent({ alerts, loading, onRefresh, onNavigate }: Props) {
  const navigate = useNavigate();

  const handleNavigate = (path?: string) => {
    if (path) {
      onNavigate();
      navigate(path);
    }
  };

  return (
    <div className="p-4 min-w-[340px]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">Vue d'ensemble des points nécessitant une attention</p>
        <button
          onClick={onRefresh}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-6 h-6 text-green-500" />
          </div>
          <p className="font-medium text-gray-700">Tout est en ordre</p>
          <p className="text-sm text-gray-500 mt-1">Aucune alerte pour le moment</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const cfg = ALERT_CONFIG[alert.type];
            return (
              <div
                key={alert.type}
                className={`rounded-lg border ${cfg.bgColor} ${cfg.borderColor} overflow-hidden`}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cfg.color}>{cfg.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</p>
                      <p className={`text-xs ${cfg.color} opacity-80`}>
                        {cfg.description(alert.count)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${cfg.color}`}>{alert.count}</span>
                    {alert.navigateTo && (
                      <button
                        onClick={() => handleNavigate(alert.navigateTo)}
                        className={`flex items-center gap-1 text-xs font-medium ${cfg.color} hover:underline`}
                      >
                        Voir <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {alert.souls && alert.souls.length > 0 && (
                  <div className={`border-t ${cfg.borderColor} px-4 py-2 space-y-1`}>
                    {alert.souls.map((soul) => (
                      <div key={soul.id} className="flex items-center justify-between">
                        <span className={`text-xs ${cfg.color} opacity-90`}>{soul.name}</span>
                        {soul.detail && (
                          <span className={`text-xs font-medium ${cfg.color} opacity-75`}>
                            {soul.detail}
                          </span>
                        )}
                      </div>
                    ))}
                    {alert.count > 5 && (
                      <p className={`text-xs ${cfg.color} opacity-60 italic`}>
                        + {alert.count - 5} autre{alert.count - 5 > 1 ? 's' : ''}…
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
