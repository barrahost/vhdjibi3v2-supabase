import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  badge?: number;
  dataTour?: string;
  children?: MenuItem[];
}

interface AccordionMenuProps {
  items: MenuItem[];
  onItemClick?: () => void;
}

/** Sum of all badge values across a subtree */
function subtreeBadge(item: MenuItem): number {
  if (item.badge && item.badge > 0) return item.badge;
  if (!item.children) return 0;
  return item.children.reduce((sum, child) => sum + subtreeBadge(child), 0);
}

function BadgePill({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 rounded-full">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function AccordionMenu({ items, onItemClick }: AccordionMenuProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(() => {
    const firstGroupWithChildren = items.find(item => Array.isArray(item.children) && item.children.length > 0);
    return firstGroupWithChildren ? [firstGroupWithChildren.id] : [];
  });
  const location = useLocation();

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return location.pathname === href;
  };

  const renderMenuItem = (item: MenuItem) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = Array.isArray(item.children) && item.children.length > 0;
    const active = isActive(item.href);
    const badgeCount = subtreeBadge(item);

    const itemContent = (
      <>
        <div className="flex items-center flex-1 min-w-0">
          {item.icon && (
            <span className="mr-3 flex-shrink-0 text-gray-500">{item.icon}</span>
          )}
          <span className={`text-base font-medium truncate ${
            active ? 'text-[#00665C]' : 'text-gray-700'
          }`}>
            {item.label}
          </span>
        </div>
        {/* Show badge only when collapsed (or on leaf items) so it doesn't duplicate */}
        {(!hasChildren || !isExpanded) && <BadgePill count={badgeCount} />}
        {hasChildren && (
          <ChevronDown className={`flex-shrink-0 w-4 h-4 text-gray-400 transition-transform duration-200 ml-1 ${
            isExpanded ? 'transform rotate-180' : ''
          }`} />
        )}
      </>
    );

    return (
      <div key={item.id} className="space-y-1">
        {item.href ? (
          <Link
            to={item.href}
            onClick={onItemClick}
            className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
              active
                ? 'bg-[#00665C]/10 text-[#00665C]'
                : 'hover:bg-gray-100'
            }`}
          >
            {itemContent}
          </Link>
        ) : (
          <button
            onClick={() => toggleItem(item.id)}
            data-tour={item.dataTour}
            className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 ${
              isExpanded ? 'bg-gray-50' : ''
            }`}
            aria-expanded={isExpanded}
            aria-controls={`submenu-${item.id}`}
          >
            {itemContent}
          </button>
        )}

        {hasChildren && (
          <div
            id={`submenu-${item.id}`}
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-[600px]' : 'max-h-0'
            }`}
            aria-hidden={!isExpanded}
          >
            <div className="pl-4 ml-4 border-l border-gray-200 space-y-1 text-sm">
              {Array.isArray(item.children) && item.children.map(child => renderMenuItem(child))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="space-y-6">
      {items.map(item => renderMenuItem(item))}
    </nav>
  );
}
