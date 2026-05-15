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
}

export function MobileTableView({ data, columns, onItemClick, className = '' }: MobileTableViewProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 bg-white rounded-lg border">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {data.map((item, index) => (
        <div
          key={item.id || index}
          className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200"
          onClick={() => onItemClick?.(item)}
        >
          <div className="p-4 space-y-3">
            {columns.map(column => {
              const value = item[column.key];
              return (
                <div key={column.key} className="flex flex-col">
                  <span className="text-xs font-medium text-gray-500 uppercase">
                    {column.title}
                  </span>
                  <div className="mt-1">
                    {column.render ? (
                      column.render(value, item)
                    ) : (
                      <span className="text-sm text-gray-900">{value}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}