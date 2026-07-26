import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useNavigationItems, NavItem } from '../../hooks/useNavigationItems';

interface NavigationProps {
  onItemClick?: () => void;
}

function BadgePill({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function NavLink({ item, onItemClick }: { item: NavItem; onItemClick?: () => void }) {
  const location = useLocation();
  const active = item.href === '/'
    ? location.pathname === '/'
    : !!item.href && location.pathname.startsWith(item.href.split('?')[0]);

  return (
    <Link
      to={item.href ?? '/'}
      onClick={onItemClick}
      data-tour={item.dataTour}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      <span className={`flex-shrink-0 ${active ? 'text-brand-700' : 'text-gray-400'}`}>
        {item.icon}
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      <BadgePill count={item.badge ?? 0} />
    </Link>
  );
}

function groupContainsActiveRoute(item: NavItem, pathname: string): boolean {
  return !!item.children?.some((child) => {
    if (!child.href) return false;
    return child.href === '/' ? pathname === '/' : pathname.startsWith(child.href.split('?')[0]);
  });
}

export default function Navigation({ onItemClick }: NavigationProps) {
  const items = useNavigationItems();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      items.forEach((item) => {
        if (item.children && item.children.length > 0 && !(item.id in next)) {
          next[item.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [items]);

  useEffect(() => {
    items.forEach((item) => {
      if (item.children && groupContainsActiveRoute(item, location.pathname)) {
        setOpenGroups((prev) => (prev[item.id] ? prev : { ...prev, [item.id]: true }));
      }
    });
    // Only re-run when the route changes, not on every items re-creation — otherwise this
    // would keep forcing the active group back open even after the user manually collapses it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <nav className="py-2 space-y-0.5">
      {items.map((item, index) => {
        if (item.children && item.children.length > 0) {
          const isOpen = openGroups[item.id] ?? true;
          return (
            <div key={item.id} className={index > 0 ? 'pt-5' : 'pt-1'}>
              <button
                type="button"
                onClick={() => toggleGroup(item.id)}
                className="w-full flex items-center justify-between px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest select-none hover:text-gray-600 transition-colors"
                aria-expanded={isOpen}
              >
                <span>{item.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
              </button>
              {isOpen && (
                <div className="space-y-0.5">
                  {item.children.map(child => (
                    <NavLink key={child.id} item={child} onItemClick={onItemClick} />
                  ))}
                </div>
              )}
            </div>
          );
        }
        return <NavLink key={item.id} item={item} onItemClick={onItemClick} />;
      })}
    </nav>
  );
}
