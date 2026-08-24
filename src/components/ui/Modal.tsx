import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog — ✅ أقصى ارتفاع = الشاشة: العنوان ثابت والجسم يسكرول داخلياً
          فالفورمات الطويلة (زي إضافة منتج) تظهر كاملة من غير سكرول الصفحة وعلى أي شاشة */}
      <div
        className={`relative bg-white rounded-2xl shadow-xl border border-gray-100 w-full ${maxWidthClasses[maxWidth]} z-10 text-right transform transition-all animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[calc(100dvh-2rem)]`}
      >
        {/* Header — ثابت فوق */}
        <div className="flex flex-row-reverse items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          {title && <h3 className="text-lg font-bold text-gray-900 font-arabic-heading">{title}</h3>}
        </div>
        {/* Body — يسكرول داخلياً لو المحتوى أطول من الشاشة */}
        <div className="px-6 pb-6 pt-4 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
};
