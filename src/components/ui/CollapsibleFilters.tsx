import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

interface CollapsibleFiltersProps {
  children: ReactNode;
  activeCount?: number;
  storageKey?: string;
  defaultOpen?: boolean;
  resetButton?: ReactNode;
}

export function CollapsibleFilters({
  children,
  activeCount = 0,
  storageKey,
  defaultOpen = false,
  resetButton,
}: CollapsibleFiltersProps) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved === 'true';
    }
    return defaultOpen;
  });

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (storageKey) localStorage.setItem(storageKey, String(next));
  };

  return (
    <div className="bg-white rounded-lg border">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-500" />
          <span className="text-base font-medium text-gray-900">Filtres</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-[#00665C] rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isOpen && activeCount > 0 && (
            <span className="text-xs text-[#00665C] font-medium hidden sm:block">
              {activeCount} filtre{activeCount > 1 ? 's' : ''} actif{activeCount > 1 ? 's' : ''}
            </span>
          )}
          {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-100">
          <div className="px-4 pt-4 pb-4 space-y-4">
            {children}
          </div>
          {resetButton && (
            <div className="px-4 pb-3 flex justify-end border-t border-gray-50 pt-2">
              {resetButton}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
