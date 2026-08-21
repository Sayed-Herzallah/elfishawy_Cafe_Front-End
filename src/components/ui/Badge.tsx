import React from 'react';

export type BadgeVariant =
  | 'available' // متوفر (blue or emerald)
  | 'low' // منخفض (amber)
  | 'out' // نفذ / غير متوفر (rose/red)
  | 'completed' // مكتمل (blue/emerald)
  | 'pending' // قيد التنفيذ (amber)
  | 'cancelled' // ملغي (rose)
  | 'neutral'
  | 'primary';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const variants = {
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    completed: 'bg-blue-50 text-[#2e5b9f] border-blue-200',
    pending: 'bg-amber-50 text-amber-800 border-amber-200',
    low: 'bg-amber-500 text-white border-amber-500 font-bold',
    out: 'bg-rose-50 text-rose-700 border-rose-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    primary: 'bg-[#2e5b9f]/10 text-[#2e5b9f] border-[#2e5b9f]/30',
  };

  const sizes = {
    sm: 'text-[11px] py-0.5 px-2.5',
    md: 'text-xs py-1 px-3',
  };

  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-lg border whitespace-nowrap shrink-0 transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
};
