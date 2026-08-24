import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useNotification } from '../contexts/NotificationContext';
import { Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SurveyPage: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [isUnavailable, setIsUnavailable] = useState(false);
  // ⚠️ لا يوجد Endpoint للاستبيان في الـ Backend حالياً — كان النموذج يعرض
  // "وصلتنا حكايتك" بينما البيانات تُرمى فعلاً، وهذا تضليل للمستخدم.
  // حتى يتوفر الـ Endpoint، نعرض حالة صريحة بأن الخدمة قيد التجهيز بدل نجاح زائف.
  const { showToast } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      showToast('الرجاء كتابة رأيك أولاً', 'error');
      return;
    }
    showToast('خدمة الاستبيان قيد التجهيز حالياً', 'info');
    setIsUnavailable(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#fcfaf7]">
      <div className="w-full max-w-lg">
        {isUnavailable ? (
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-xl border border-gray-100 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-arabic-heading text-gray-900">
              الاستبيان قيد التجهيز
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              نعتذر، خدمة الاستبيان الإلكتروني غير متاحة حالياً ولم يتم إرسال ردك.
              يسعدنا سماع رأيك دائماً عند زيارتنا للمقهى.
            </p>
            <div className="pt-4">
              <Link
                to="/menu"
                className="inline-flex items-center justify-center bg-[#2e5b9f] text-white font-bold py-2.5 px-6 rounded-xl text-xs"
              >
                تصفح المنيو
              </Link>
            </div>
          </div>
        ) : (
          <div className="relative bg-[#f6f2e9] rounded-3xl p-8 md:p-12 shadow-2xl border-4 border-white text-right">
            <h1 className="text-2xl md:text-3xl font-bold font-arabic-heading text-gray-900 mb-6">
              احكِ لنا حكايتك مع القهوة.
            </h1>

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <textarea
                rows={6}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="اكتب رأيك أو اقتراحك أو قصة جمعتك بفنجان قهوتنا..."
                className="w-full bg-[#eee9dc]/70 hover:bg-[#eee9dc] focus:bg-white border-none rounded-2xl p-4 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-[#2e5b9f] transition-all resize-none shadow-inner"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-3 text-sm rounded-xl shadow-md"
              >
                إرسال الرد
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
