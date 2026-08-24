import React from 'react';
import { Link } from 'react-router-dom';
import { Coffee, ArrowLeft } from 'lucide-react';
import { usePageSEO } from '../seo/usePageSEO';
import { PAGE_SEO } from '../seo/seoConfig';

export const NotFoundPage: React.FC = () => {
  // صفحة خطأ — مستبعدة من الفهرسة لتفادي Soft-404
  usePageSEO({ meta: PAGE_SEO.notFound });

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#2e5b9f] flex items-center justify-center mb-4">
        <Coffee className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-bold font-arabic-heading text-gray-900 mb-2">404</h1>
      <h2 className="text-xl font-bold text-gray-800 mb-2">الصفحة غير موجودة</h2>
      <p className="text-xs text-gray-500 max-w-sm mb-6">
        عذراً، الرابط الذي تحاول الوصول إليه غير متوفر أو تم نقله.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition"
      >
        <span>العودة للرئيسية</span>
        <ArrowLeft className="w-4 h-4" />
      </Link>
    </div>
  );
};
