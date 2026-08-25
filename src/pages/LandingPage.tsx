import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MENU_ITEMS, DEFAULT_MENU_IMAGE, getItemPriceRange, getCategoryById } from '../data/menuData';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { usePageSEO } from '../seo/usePageSEO';
import { PAGE_SEO } from '../seo/seoConfig';
import { buildWebSiteSchema, buildCafeSchema } from '../seo/structuredData';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  usePageSEO({
    meta: PAGE_SEO.home,
    jsonLd: [buildWebSiteSchema(), buildCafeSchema()],
  });

  // المنيو ثابت من src/data/menuData.ts — المميزة (الأكثر طلباً) الأول
  const featuredItems = [
    ...MENU_ITEMS.filter((item) => item.isPopular),
    ...MENU_ITEMS.filter((item) => !item.isPopular),
  ].slice(0, 4);

  const moodOptions = [
    { title: 'جلسة طويلة', query: 'coffee' },
    { title: 'صباح هادئ', query: 'bakery' },
    { title: 'شيء حلو', query: 'desserts' },
    { title: 'اختيار خفيف لوقتك الضيق', query: 'cold' },
  ];

  return (
    <div className="flex flex-col text-[#1c1917]">
      {/* Hero Section with Calligraphy */}
      <section className="relative min-h-[600px] flex items-center justify-center bg-gray-950 text-white overflow-hidden py-24 px-6">
        {/* Background Image with Dark Vignette */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transform transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=75&w=1200&auto=format&fit=crop')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/70" />

        {/* Hero Content */}
        <div className="relative z-10 text-center max-w-2xl mx-auto flex flex-col items-center gap-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-bold font-arabic-heading tracking-tight leading-tight">
              كافيه الفيشاوي
              <br />
              <span className="text-blue-300 font-calligraphy text-5xl md:text-7xl block mt-2">
                قهوة معمولة بمزاج
              </span>
            </h1>
            <p className="text-gray-300 text-sm md:text-base max-w-md mx-auto pt-2">
              في ههيا بالشرقية، تجربة قهوة أصيلة تجمع بين التراث العريق والإتقان الحديث في كافيه الفيشاوي.
            </p>
          </div>

          <Link
            to="/menu"
            className="inline-flex items-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/30 text-sm mt-4 group"
          >
            <span>اكتشف المنيو</span>
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Concept Section: "أكثر من مجرد فنجان" */}
      <section id="about" className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="text-right space-y-5">
            <h2 className="text-3xl md:text-4xl font-bold font-arabic-heading text-gray-900 leading-snug">
              أكثر من مجرد فنجان
            </h2>
            <div className="w-16 h-1 bg-[#2e5b9f] rounded-full"></div>
            <p className="text-gray-600 text-base leading-relaxed">
              صممنا هذا المكان للحظات التي تقع بين تفاصيل يومك: قهوة قبل العمل، أحاديث طويلة على كوب من الكولد برو، وعصريات هادئة بصحبة كتاب.
            </p>
            <p className="text-2xl text-[#2e5b9f] font-calligraphy pt-2">
              اجلس قليلاً ... واستمتع أكثر.
            </p>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-4/3">
              <img
                src="https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop"
                alt="سكب الحليب على القهوة"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Full Width Blue Banner */}
      <section className="bg-[#2e5b9f] text-white py-16 px-6 text-center shadow-inner">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl md:text-5xl font-calligraphy leading-relaxed">
            بعض اللحظات لا تحتاج إلى موعد.
          </h3>
        </div>
      </section>

      {/* Featured Menu: "من قائمتنا" — من المنيو الثابت */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-200">
          <Link
            to="/menu"
            className="text-xs font-bold text-[#2e5b9f] hover:underline flex items-center gap-1"
          >
            <span>عرض المنيو الكامل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
          <h2 className="text-2xl md:text-3xl font-bold font-arabic-heading text-gray-900">
            من قائمتنا
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featuredItems.map((item) => {
            const category = getCategoryById(item.categoryId);
            const price = getItemPriceRange(item).min;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group cursor-pointer"
                onClick={() => navigate('/menu')}
              >
                <div className="aspect-square w-full overflow-hidden bg-gray-100 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_MENU_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.isPopular && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold py-1 px-2 rounded bg-amber-400 text-amber-950">
                        <Sparkles className="w-3 h-3" />
                        الأكثر طلباً
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4 text-right flex flex-col justify-between flex-1">
                  <div>
                    {category && (
                      <span className="text-[10px] font-bold text-[#2e5b9f] bg-[#2e5b9f]/[0.07] px-2 py-0.5 rounded">
                        {category.icon} {category.name}
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 text-base mt-1.5">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                  <div className="pt-3 mt-2 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-xs text-gray-400">السعر</span>
                    <span className="font-bold text-sm text-[#2e5b9f] font-mono">{price} جنيها</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mood Selector: "اختر ما يناسب مزاجك" */}
      <section className="py-16 px-6 max-w-4xl mx-auto w-full">
        <div className="text-right mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-arabic-heading text-gray-900">
            اختر ما يناسب مزاجك
          </h2>
          <p className="text-xs text-gray-500 mt-1">نقترح بناءً على اهتمامك</p>
        </div>

        <div className="space-y-3">
          {moodOptions.map((mood, idx) => (
            <button
              key={idx}
              onClick={() => navigate(`/menu`)}
              className="w-full bg-white hover:bg-[#faf8f5] border border-gray-200 rounded-2xl p-4 flex items-center justify-between transition-all duration-150 group shadow-2xs text-right"
            >
              <ArrowLeft className="w-4 h-4 text-gray-400 group-hover:text-[#2e5b9f] group-hover:-translate-x-1 transition-all" />
              <span className="font-bold text-sm text-gray-800 group-hover:text-[#2e5b9f]">
                {mood.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Story / Survey Banner: "احكِ لنا حكايتك مع القهوة" */}
      <section id="contact" className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="relative rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-[#f9f6f0] p-8 md:p-14 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-2xl md:text-3xl font-bold font-arabic-heading text-gray-900">
              احكِ لنا حكايتك مع القهوة.
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              رأيك واقتراحاتك تهمنا لنصنع لك تجربة قهوة لا تُنسى في كل زيارة.
            </p>
            <Link
              to="/survey"
              className="inline-flex items-center justify-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-3 px-6 rounded-xl transition shadow-sm text-xs mt-2"
            >
              <span>شاركنا رأيك – يستغرق دقيقة واحدة</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
