import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends { id: string }>({ 
  data, 
  columns, 
  onRowClick,
  loading = false,
  emptyMessage = 'Nenhum dado encontrado'
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="bg-[#111c22] rounded-xl p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-white/60 mt-4">Carregando...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[#111c22] rounded-xl p-8 text-center">
        <p className="text-white/60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111c22] rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-6 py-4 text-left text-sm font-medium text-white/70"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <motion.tr
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onRowClick?.(item)}
                className={`border-b border-white/5 ${
                  onRowClick ? 'cursor-pointer hover:bg-white/5' : ''
                } transition-colors`}
              >
                {columns.map((column) => (
                  <td
                    key={String(column.key)}
                    className="px-6 py-4 text-sm text-white"
                  >
                    {column.render
                      ? column.render(item)
                      : String(item[column.key as keyof T] || '-')}
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
