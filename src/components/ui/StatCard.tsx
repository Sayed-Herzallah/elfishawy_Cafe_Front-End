import React, { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  percentage?: number;
  isPositive?: boolean;
  icon?: ReactNode;
  variant?: 'blue' | 'pink' | 'neutral';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  percentage,
  isPositive = true,
  icon,
  variant = 'blue',
  className = '',
}) => {
  const variantStyles = {
    blue: 'bg-[#e8f1fd] border-transparent text-[#1e3a8a]',
    pink: 'bg-[#feecee] border-transparent text-[#9f1239]',
    neutral: 'bg-white border-gray-100 text-gray-900',
  };

  const clampedPercentage = percentage === undefined ? 0 : Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col justify-between border transition-all duration-200 shadow-xs ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold opacity-80">{title}</span>
        {icon && <span className="opacity-70">{icon}</span>}
      </div>

      <div className="my-2.5">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        {subtitle && <div className="text-xs opacity-75 mt-0.5">{subtitle}</div>}
      </div>

      {percentage !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between gap-2 text-[10px] font-bold mb-1">
            <span className="opacity-60">النسبة</span>
            <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
              {clampedPercentage}%
            </span>
          </div>
          <div className="h-1.5 w-full bg-black/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isPositive ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${clampedPercentage}%` }}
            />
          </div>
        </div>
      )}

      {change && (
        <div className="flex items-center gap-1 text-[11px] font-medium">
          <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
            {isPositive ? '↗' : '↘'} {change}
          </span>
          <span className="opacity-60">عن الفترة السابقة</span>
        </div>
      )}
    </div>
  );
};
