import React, { ReactNode } from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyText?: string;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  emptyText = 'لا توجد بيانات متاحة حالياً',
  isLoading = false,
  onRowClick,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-gray-400 gap-3">
        <div className="w-8 h-8 border-3 border-[#2e5b9f]/20 border-t-[#2e5b9f] rounded-full animate-spin"></div>
        <p className="text-sm font-medium">جاري تحميل البيانات...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="w-full py-16 text-center text-gray-500 text-sm">
        <div className="max-w-xs mx-auto p-4 bg-[#faf8f5] rounded-xl border border-dashed border-gray-200">
          <p>{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-right border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 font-semibold text-xs bg-transparent">
            {columns.map((col, idx) => (
              <th key={idx} className={`py-3.5 px-4 font-semibold ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-gray-800">
          {data.map((row) => (
            <tr
              key={keyExtractor(row)}
              onClick={() => onRowClick && onRowClick(row)}
              className={`hover:bg-[#faf8f5]/60 transition-colors ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
            >
              {columns.map((col, idx) => {
                let content: ReactNode = null;
                if (typeof col.accessor === 'function') {
                  content = col.accessor(row);
                } else if (col.accessor) {
                  content = String(row[col.accessor] ?? '');
                }
                return (
                  <td key={idx} className={`py-4 px-4 align-middle ${col.className || ''}`}>
                    {content}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
