import React, { SelectHTMLAttributes, forwardRef } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  isRequired?: boolean;
  options: { value: string | number; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, isRequired, options, className = '', id, required, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isFieldRequired = required || isRequired || (typeof label === 'string' && label.includes('*'));
    const cleanLabel = typeof label === 'string' ? label.replace(/\*/g, '').trim() : label;

    return (
      <div className="w-full flex flex-col gap-1 text-right">
        {cleanLabel && (
          <label htmlFor={selectId} className="text-xs font-bold text-gray-700 select-none flex items-center justify-start gap-1">
            <span>{cleanLabel}</span>
            {isFieldRequired && <span className="text-rose-600 font-bold text-sm">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            required={required}
            className={`w-full appearance-none bg-[#faf8f5] hover:bg-white focus:bg-white border rounded-xl pr-3.5 pl-9 py-2.5 text-xs text-gray-900 transition-all duration-150 focus:outline-none cursor-pointer ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 bg-rose-50/20'
                : 'border-gray-200 focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-0.5 animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && <p className="text-[11px] text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
