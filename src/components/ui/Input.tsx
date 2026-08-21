import React, { InputHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
  touched?: boolean;
  isSubmitted?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, isRequired, touched, isSubmitted, className = '', id, required, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isFieldRequired = required || isRequired || (typeof label === 'string' && label.includes('*'));

    // Clean label text if it already has *
    const cleanLabel = typeof label === 'string' ? label.replace(/\*/g, '').trim() : label;

    // Show red border if there's an error, or if field is required and was touched/submitted but is empty
    const showError = error || (isFieldRequired && (touched || isSubmitted) && !props.value);

    return (
      <div className="w-full flex flex-col gap-1 text-right">
        {cleanLabel && (
          <label htmlFor={inputId} className="text-xs font-bold text-gray-700 select-none flex items-center justify-start gap-1">
            <span>{cleanLabel}</span>
            {isFieldRequired && <span className="text-rose-600 font-bold text-sm">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-gray-400 flex items-center z-10">
              {leftIcon}
            </div>
          )}
          {/* Native `required` is intentionally disabled below the input:
              the browser's generic popup would block submission before our
              clear Arabic per-field validation messages can appear. */}
          <input
            id={inputId}
            ref={ref}
            required={false}
            className={`w-full bg-[#faf8f5] hover:bg-white focus:bg-white border rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 transition-all duration-150 focus:outline-none ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              showError
                ? 'border-rose-400 ring-2 ring-rose-100/60 focus:border-rose-500 focus:ring-2 focus:ring-rose-200/50 bg-white'
                : 'border-gray-200 focus:ring-2 focus:ring-[#2e5b9f]/20 focus:border-[#2e5b9f]'
            } ${className}`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-gray-400 flex items-center z-10">
              {rightIcon}
            </div>
          )}
        </div>
        {showError && (
          <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-0.5 animate-in fade-in duration-150">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error || 'هذا الحقل مطلوب'}</span>
          </p>
        )}
        {helperText && !showError && <p className="text-[11px] text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
