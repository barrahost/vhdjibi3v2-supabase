import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface StatDetail {
  label: string;
  value: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  trend: string;
  trendLabel: string;
  iconClassName?: string;
  className?: string;
  details?: StatDetail[];
  onClick?: () => void;
  linkLabel?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  iconClassName = 'text-amber-500',
  className = '',
  details,
  onClick,
  linkLabel,
}: StatCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isClickable = !!onClick;

  return (
    <div
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      className={`
        bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 relative
        ${isClickable ? 'cursor-pointer transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-700/30' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide leading-tight truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">
            <span className="font-semibold text-brand-700">{trend}</span> {trendLabel}
          </p>
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 ${iconClassName}`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {isClickable && linkLabel && (
        <div className="mt-3 inline-flex items-center text-xs font-medium text-brand-700">
          {linkLabel}
          <ArrowRight className="w-3 h-3 ml-1" />
        </div>
      )}

      {details && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className="absolute bottom-2 right-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className={`mt-4 pt-4 border-t space-y-2 transition-all duration-300 ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-600">{detail.label}</span>
                <span className="font-medium text-gray-900">{detail.value}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
