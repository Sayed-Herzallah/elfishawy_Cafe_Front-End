 import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
  icon,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-50 text-[#9f1239]',
      confirmBtn: 'bg-[#9f1239] hover:bg-[#881337]',
      border: 'border-rose-200',
    },
    warning: {
      iconBg: 'bg-amber-50 text-amber-700',
      confirmBtn: 'bg-amber-600 hover:bg-amber-700',
      border: 'border-amber-200',
    },
    info: {
      iconBg: 'bg-blue-50 text-[#2e5b9f]',
      confirmBtn: 'bg-[#2e5b9f] hover:bg-[#244b85]',
      border: 'border-blue-200',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-sm p-6 z-10 text-right animate-in fade-in zoom-in-95 duration-150 font-sans">
        <button
          onClick={onCancel}
          className="absolute top-3 left-3 text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${styles.iconBg} mx-auto mb-3`}>
          {icon || <AlertTriangle className="w-6 h-6" />}
        </div>

        <h3 className="text-base font-bold font-arabic-heading text-gray-900 text-center">
          {title}
        </h3>

        <p className="text-xs text-gray-500 text-center mt-1.5 leading-relaxed">
          {message}
        </p>

        <div className="mt-5 space-y-2">
          <button
            onClick={onConfirm}
            className={`w-full ${styles.confirmBtn} text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-2xs cursor-pointer`}
          >
            {confirmText}
          </button>

          <button
            onClick={onCancel}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl text-xs transition cursor-pointer"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};