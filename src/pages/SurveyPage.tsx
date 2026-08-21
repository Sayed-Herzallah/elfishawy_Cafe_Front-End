import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { useNotification } from '../contexts/NotificationContext';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SurveyPage: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { showToast } = useNotification();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) {
      showToast('الرجاء كتابة رأيك أولاً', 'error');
      return;
    }
    setIsSubmitted(true);
    showToast('شكراً لمشاركتك حكايتك معنا!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-[#fcfaf7]">
      <div className="w-full max-w-lg">
        {isSubmitted ? (
          <div className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-xl border border-gray-100 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold font-arabic-heading text-gray-900">
              وصلتنا حكايتك بمحبة!
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xs mx-auto">
              نشكرك على مشاركة تجربتك. رأيك يساعدنا لنقدم دائماً أفضل ما لدينا في الفيشاوي.
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
