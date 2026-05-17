import { ReactNode } from 'react';

interface MobileTableViewProps {
  data: any[];
  columns: {
    key: string;
    title: string | ReactNode;
    render?: (value: any, item: any) => ReactNode;
  }[];
  onItemClick?: (item: any) => void;
  className?: string;
  /** Optional custom card renderer — replaces the generic column dump */
  mobileCard?: (item: any) => ReactNode;
}

export function MobileTableView({ data, columns, onItemClick, className = '', mobileCard }: MobileTableViewProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((item, index) => (
        <div
          key={item.id || index}
          className="bg-white rounded-lg border shadow-sm overflow-hidden active:bg-gray-50 transition-colors"
          onClick={() => onItemClick?.(item)}
        >
          {mobileCard ? (
            mobileCard(item)
          ) : (
            <div className="p-4 space-y-2">
              {columns
                .filter(col => col.key !== 'checkbox') // hide checkboxes in mobile generic view
                .map(column => {
                  const value = item[column.key];
                  return (
                    <div key={column.key} className="flex items-start gap-2">
                      <span className="text-xs font-medium text-gray-400 uppercase w-24 flex-shrink-0 pt-0.5">
                        {typeof column.title === 'string' ? column.title : ''}
                      </span>
                      <div className="flex-1 min-w-0">
                        {column.render ? (
                          column.render(value, item)
                        ) : (
                          <span className="text-sm text-gray-900 break-words">{value ?? '—'}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
