import React, { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-12 bg-white border border-dashed border-gray-200 rounded-2xl px-6 ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#2e5b9f]/5 border border-[#2e5b9f]/15 flex items-center justify-center text-[#2e5b9f] mb-4">
        {icon ?? <SearchX className="w-7 h-7" />}
      </div>
      <h4 className="text-sm font-bold text-gray-800 mb-1.5 leading-snug">{title}</h4>
      {description && (
        <p className="text-xs text-gray-500 max-w-sm text-center mb-4 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
