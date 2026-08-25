/**
 * إعدادات SEO المركزية لكافيه الفيشاوي
 * --------------------------------------
 * كل ما يخص هوية الموقع في البحث والسوشيال من مكان واحد.
 *
 * ⚠️ مهم: عند ربط دومين نهائي، عدّل VITE_SITE_URL في ملف .env
 * ثم أعد البناء — كل الـcanonical والـOG والـsitemap بتقرأ منه.
 */

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://fishawy.vercel.app').replace(/\/$/, '');

export const SITE_NAME = 'كافيه الفيشاوي';

export const SITE_LANGUAGE = 'ar_EG';

/** صورة السوشيال الافتراضية — يُفضل استبدالها لاحقاً بصورة ماركة محلية (1200×630) */
export const DEFAULT_OG_IMAGE = 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1200&auto=format&fit=crop';

export const DEFAULT_OG_IMAGE_ALT = 'كوب قهوة مُعدّة بعناية في كافيه الفيشاوي';

export interface PageSeoMeta {
  /** عنوان الصفحة الكامل (يُعرض في تبويب المتصفح ونتائج جوجل) */
  title: string;
  description: string;
  /** المسار بعد الدومين مثل '/' أو '/menu' — يُستخدم للـcanonical والـog:url */
  path: string;
  /** 'index, follow' افتراضياً — استخدم 'noindex, nofollow' للصفحات الخاصة */
  robots?: string;
  /** صورة السوشيال الخاصة بالصفحة إن وُجدت */
  image?: string;
}

/**
 * خريطة الصفحات العامة (القابلة للفهرسة) — لكل صفحة عنوان ووصف فريد
 * يطابق محتواها الفعلي ونوايا البحث الحقيقية.
 *
 * الصفحات الخاصة (login / admin / pos) لا تُفهرس إطلاقاً — انظر LoginPage
 * وNotFoundPage حيث robots = 'noindex, nofollow'.
 */
export const PAGE_SEO: Record<string, PageSeoMeta> = {
  home: {
    title: 'كافيه الفيشاوي ههيا | أفضل كافيه في ههيا بالشرقية',
    description:
      'كافيه الفيشاوي بههيا في محافظة الشرقية: قهوة بلدي على الرمل، شاي مصري، وعصائر طبيعية في أجواء تراثية رائعة. تصفح منيو ههيا كافيه وتعرف على الأسعار.',
    path: '/',
  },
  menu: {
    title: 'منيو المشروبات والأسعار | كافيه الفيشاوي',
    description:
      'قائمة مشروبات كافيه الفيشاوي كاملة بالأسعار: قهوة تركي بأنواعها، إسبريسو وكابتشينو ولاتيه، شاي وأعشاب، مشروبات باردة، عصائر طازجة طبيعية، وميلك شيك.',
    path: '/menu',
  },
  survey: {
    title: 'شاركنا رأيك | كافيه الفيشاوي',
    description:
      'رأيك يهمنا في كافيه الفيشاوي. شاركنا تجربتك حول القهوة والخدمة والأجواء وساعدنا نطور تجربتك القادمة.',
    path: '/survey',
  },
  developers: {
    title: 'عن المبرمجين | كافيه الفيشاوي',
    description:
      'تعرّف على فريق تطوير موقع ونظام كافيه الفيشاوي، ومن قام ببناء المنصة التقنية خلف التجربة.',
    path: '/developers',
  },
  login: {
    title: 'تسجيل الدخول | كافيه الفيشاوي',
    description: 'بوابة دخول فريق عمل كافيه الفيشاوي إلى نظام الإدارة ونقطة البيع.',
    path: '/login',
    robots: 'noindex, nofollow',
  },
  notFound: {
    title: 'الصفحة غير موجودة | كافيه الفيشاوي',
    description: 'الرابط الذي تحاول الوصول إليه غير متوفر. تصفح منيو كافيه الفيشاوي أو عد إلى الصفحة الرئيسية.',
    path: '/404',
    robots: 'noindex, nofollow',
  },
};
