import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MoreHorizontal, X, LogOut } from 'lucide-react';
import { useNavigationItems, NavItem } from '../../hooks/useNavigationItems';
import { useAuth } from '../../contexts/AuthContext';
import Navigation from './Navigation';
import toast from 'react-hot-toast';

function BadgeDot({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex-shrink-0 inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold text-white bg-red-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/** Pick up to 3 primary tab items from the nav tree (Dashboard + next 2 meaningful items).
 * "Sortir" (deconnexion) n'occupe plus de place ici -- c'est une action rare, pas une
 * destination de navigation, et elle reste accessible dans le panneau "Plus". */
function getMobilePrimaryTabs(items: NavItem[]): Array<{ id: string; label: string; icon: React.ReactNode; href: string; badge: number }> {
  const tabs: Array<{ id: string; label: string; icon: React.ReactNode; href: string; badge: number }> = [];

  for (const item of items) {
    if (tabs.length >= 3) break;

    if (item.href) {
      tabs.push({ id: item.id, label: item.label, icon: item.icon, href: item.href, badge: item.badge ?? 0 });
    } else if (item.children && item.children.length > 0) {
      const firstChild = item.children[0];
      if (firstChild.href) {
        const totalBadge = item.children.reduce((sum, c) => sum + (c.badge ?? 0), 0);
        const label = item.children.length === 1 ? item.children[0].label : item.label;
        tabs.push({ id: item.id, label, icon: item.icon, href: firstChild.href, badge: totalBadge });
      }
    }
  }

  return tabs;
}

export function MobileBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const items = useNavigationItems();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout?.();
      toast.success('Déconnexion réussie');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    } finally {
      setIsLoggingOut(false);
    }
  };
  const primaryTabs = getMobilePrimaryTabs(items);

  const isTabActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href.split('?')[0]);

  return (
    <>
      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex lg:hidden safe-b">
        {primaryTabs.map(tab => {
          const active = isTabActive(tab.href);
          return (
            <Link
              key={tab.id}
              to={tab.href}
              className={`relative flex-1 flex flex-col items-center justify-center pt-2 pb-3 gap-0.5 transition-colors ${
                active ? 'text-brand-700' : 'text-gray-400'
              }`}
            >
              <span className="relative">
                {tab.icon}
                <BadgeDot count={tab.badge} />
              </span>
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-brand-700' : 'text-gray-400'}`}>
                {tab.label.length > 8 ? tab.label.split(' ')[0] : tab.label}
              </span>
            </Link>
          );
        })}

        {/* Plus button */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center justify-center pt-2 pb-3 gap-0.5 text-gray-400"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium leading-none">Plus</span>
        </button>
      </div>

      {/* More sheet */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          onClick={() => setMoreOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[85dvh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">Navigation</p>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Full nav */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <Navigation onItemClick={() => setMoreOpen(false)} />
            </div>

            {/* Déconnexion */}
            <div className="flex-shrink-0 px-4 pb-8 pt-2 border-t border-gray-100">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Déconnexion...' : 'Se déconnecter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
