import { ReactNode } from 'react';
import { MobileTableView } from './MobileTableView';

interface Column {
  key: string;
  title: string | ReactNode;
  render?: (value: any, item: any) => ReactNode;
}

interface TableProps {
  data: any[];
  columns: Column[];
  onRowClick?: (item: any) => void;
  className?: string;
}

export function CustomTable({ data, columns, onRowClick, className = '' }: TableProps) {
  // Afficher la vue mobile sur les petits écrans
  return (
    <>
      {/* Vue mobile */}
      <div className="lg:hidden">
        <MobileTableView
          data={data}
          columns={columns}
          onItemClick={onRowClick}
          className={className}
        />
      </div>

      {/* Vue desktop */}
      <div className="hidden lg:block">
        <div className={`bg-white rounded-lg shadow-sm border overflow-hidden ${className}`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map(column => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  data.map((item, index) => (
                    <tr
                      key={item.id || index}
                      onClick={() => onRowClick?.(item)}
                      className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                    >
                      {columns.map(column => (
                        <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                          {column.render ? (
                            column.render(item[column.key], item)
                          ) : (
                            <span className="text-sm text-gray-900">
                              {item[column.key]}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}