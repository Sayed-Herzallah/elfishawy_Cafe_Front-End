 import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface NotificationContextValue {
  showToast: (message: string, type?: ToastType) => void;
  showError: (error: any) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    // Prevent duplicate identical toasts within 3 seconds
    setToasts((prev) => {
      const duplicate = prev.find((t) => t.message === message && t.type === type);
      if (duplicate) return prev;
      const id = Math.random().toString(36).substring(2, 9);
      const newToasts = [...prev, { id, message, type }];
      setTimeout(() => {
        setToasts((current) => current.filter((t) => t.id !== id));
      }, 3500);
      return newToasts;
    });
  }, []);

  // Map common English/backend error messages to Arabic
  const translateError = (rawMsg: string): string => {
    const errorMap: Record<string, string> = {
      // Network / Server
      'Failed to fetch': 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت',
      'Network Error': 'خطأ في الشبكة، تحقق من اتصالك بالإنترنت',
      'Internal Server Error': 'خطأ داخلي في الخادم، يرجى المحاولة لاحقاً',
      'Service Unavailable': 'الخدمة غير متاحة حالياً، يرجى المحاولة لاحقاً',
      'Gateway Timeout': 'انتهى وقت الاستجابة، يرجى المحاولة مجدداً',
      'Bad Gateway': 'خطأ في البوابة، يرجى المحاولة لاحقاً',
      'Request Timeout': 'انتهت مهلة الطلب، يرجى المحاولة مجدداً',
      // Auth
      'Unauthorized': 'غير مصرح لك، يرجى تسجيل الدخول',
      'Forbidden': 'ليس لديك صلاحية للوصول',
      'Invalid credentials': 'اسم المستخدم أو كلمة المرور غير صحيحة',
      'Invalid password': 'كلمة المرور غير صحيحة',
      'User not found': 'المستخدم غير موجود',
      'Token expired': 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
      'jwt expired': 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
      'jwt malformed': 'جلسة غير صالحة، يرجى تسجيل الدخول مجدداً',
      // Validation
      'Validation failed': 'بيانات غير صحيحة، يرجى مراجعة الحقول',
      'is required': 'هذا الحقل مطلوب',
      'must be unique': 'هذا الاسم مستخدم مسبقاً',
      'already exists': 'هذا العنصر موجود مسبقاً',
      'duplicate key': 'هذا العنصر موجود مسبقاً',
      'Duplicate entry': 'إدخال مكرر، هذا العنصر موجود بالفعل',
      'Not Found': 'العنصر المطلوب غير موجود',
      'not found': 'العنصر المطلوب غير موجود',
      // Specific app errors
      'Insufficient stock': 'الكمية المتاحة في المخزون غير كافية',
      'insufficient stock': 'الكمية المتاحة في المخزون غير كافية',
      'Cannot delete': 'لا يمكن الحذف، قد يكون هذا العنصر مرتبطاً ببيانات أخرى',
      'Cannot update': 'لا يمكن التحديث في الوقت الحالي',
    };

    // Try direct match
    for (const [key, arabic] of Object.entries(errorMap)) {
      if (rawMsg.toLowerCase().includes(key.toLowerCase())) {
        return arabic;
      }
    }

    // If the message already contains Arabic chars, return as-is
    if (/[\u0600-\u06FF]/.test(rawMsg)) return rawMsg;

    // Otherwise return generic
    return 'حدث خطأ، يرجى المحاولة مجدداً';
  };

  const showError = useCallback((error: any) => {
    let msg = 'حدث خطأ غير متوقع، يرجى المحاولة مجدداً';
    if (typeof error === 'string') {
      msg = translateError(error);
    } else if (error?.details && Array.isArray(error.details) && error.details.length > 0) {
      msg = error.details.map((d: string) => translateError(d)).join('، ');
    } else if (error?.message) {
      msg = translateError(error.message);
    } else if (error?.error) {
      msg = translateError(error.error);
    }
    showToast(msg, 'error');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  return (
    <NotificationContext.Provider value={{ showToast, showError }}>
      {children}
      
      {/* Right Toast Container (all notifications on the right side for RTL) */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none text-right font-sans">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-xl shadow-lg border text-xs font-bold transition-all duration-200 animate-in slide-in-from-right-3 fade-in ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : toast.type === 'error'
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-blue-50 border-blue-300 text-blue-950'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-[#2e5b9f] shrink-0 mt-0.5" />}
            <div className="flex-1 leading-snug">{toast.message}</div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};