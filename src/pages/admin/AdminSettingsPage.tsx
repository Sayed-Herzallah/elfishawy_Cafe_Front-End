import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { User } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useNotification();

    const [userName, setUserName] = useState(user?.userName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileErrors, setProfileErrors] = useState<{ userName?: string; phone?: string }>({});

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { userName?: string; phone?: string } = {};

    if (!userName.trim()) {
      errors.userName = 'الاسم الكامل مطلوب';
    }
    if (!phone.trim()) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[0-9+\s-]{10,15}$/.test(phone.trim())) {
      errors.phone = 'الرجاء إدخال رقم هاتف صحيح';
    }

    if (Object.keys(errors).length > 0) {
      setProfileErrors(errors);
      showToast('الرجاء تصحيح الحقول المميزة باللون الأحمر', 'error');
      return;
    }

    setProfileErrors({});
    setIsUpdating(true);
    const success = await updateProfile({ userName, phone, address });
    setIsUpdating(false);
    if (success) {
      showToast('تم حفظ بيانات الملف الشخصي بنجاح');
    }
  };

  return (
    <div className="space-y-8 text-right max-w-4xl font-sans">
      {/* Top Header */}
      <div className="pb-2 border-b border-gray-200/60">
        <h1 className="text-2xl font-bold font-arabic-heading text-gray-900">
          إعدادات الملف الشخصي
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          إدارة بيانات الحساب الشخصي والمعلومات الخاصة بك.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-4 mb-4 border-b border-gray-100 text-gray-900">
          <User className="w-5 h-5 text-[#2e5b9f]" />
          <h3 className="font-bold text-base">بيانات المدير / المستخدم الحالي</h3>
        </div>

        <form noValidate onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="الاسم الكامل *"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                if (profileErrors.userName) setProfileErrors({ ...profileErrors, userName: undefined });
              }}
              error={profileErrors.userName}
              required
            />
            <Input
              label="البريد الإلكتروني (غير قابل للتعديل)"
              value={user?.email || 'admin@elfishawy.com'}
              disabled
              className="bg-gray-50 opacity-80"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* <Input
              label="رقم الهاتف *"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (profileErrors.phone) setProfileErrors({ ...profileErrors, phone: undefined });
              }}
              error={profileErrors.phone}
              required
            /> */}
            {/* <Input
              label="العنوان"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            /> */}
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdating}
              className="bg-[#2e5b9f]"
            >
              تحديث بياناتي
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};