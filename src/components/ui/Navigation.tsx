import { Link, useLocation } from 'react-router-dom';
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

export default function Navigation({ onItemClick }: NavigationProps) {
  const items = useNavigationItems();

  return (
    <nav className="py-2 space-y-0.5">
      {items.map((item, index) => {
        if (item.children && item.children.length > 0) {
          return (
            <div key={item.id} className={index > 0 ? 'pt-5' : 'pt-1'}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-widest select-none">
                {item.label}
              </p>
              <div className="space-y-0.5">
                {item.children.map(child => (
                  <NavLink key={child.id} item={child} onItemClick={onItemClick} />
                ))}
              </div>
            </div>
          );
        }
        return <NavLink key={item.id} item={item} onItemClick={onItemClick} />;
      })}
    </nav>
  );
}
