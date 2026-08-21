import React, { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

export interface DataViewCardProps {
  id: string;
  title: string;
  subtitle?: string;
  accentColor?: 'blue' | 'emerald' | 'amber' | 'rose' | 'gray';
  onClick?: () => void;
  children: ReactNode; // Main content area (flexible)
  actions?: ReactNode; // Right-aligned action buttons
  isSelected?: boolean;
}

const accentMap: Record<string, string> = {
  blue: 'border-l-[#2e5b9f]',
  emerald: 'border-l-emerald-600',
  amber: 'border-l-amber-600',
  rose: 'border-l-rose-600',
  gray: 'border-l-gray-400',
};

/**
 * Reusable card-based record container.
 * - Clickable to open detail/modal.
 * - Right-aligned (RTL).
 * - Accent border on the left for visual status tagging.
 * - Flexible children layout for any entity (sales, inventory, expenses).
 */
export const DataViewCard: React.FC<DataViewCardProps> = ({
  id,
  title,
  subtitle,
  accentColor = 'gray',
  onClick,
  children,
  actions,
  isSelected = false,
}) => {
  const accentClass = accentMap[accentColor] || accentMap.gray;

  return (
    <div
      key={id}
      onClick={onClick}
      className={`
        bg-white border border-gray-100/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer
        ${accentClass} border-l-4
        ${isSelected ? 'ring-2 ring-[#2e5b9f]/20 bg-[#faf8f5]' : ''}
        group
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 mb-0.5 truncate">{title}</h4>
          {subtitle && <p className="text-[10px] text-gray-500 font-medium truncate">{subtitle}</p>}
        </div>
        <div className="flex items-center justify-start gap-1 shrink-0">
          {actions && <div className="flex items-center gap-1">{actions}</div>}
          <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
        </div>
      </div>

      <div className="text-sm text-gray-700 pb-2">{children}</div>
    </div>
  );
};