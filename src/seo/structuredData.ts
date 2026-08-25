/**
 * بيانات منظمة Schema.org JSON-LD — معلومات حقيقية فقط من الموقع
 * ----------------------------------------------------------------
 * لا نخترع تقييمات أو عناوين أو أرقام هواتف أو مواعيد عمل غير متاحة فعلياً.
 * المعلومات المستخدمة: اسم الكافيه، وصفه، موقعه في خان الخليلي بالقاهرة
 * (كما يظهر في محتوى الصفحة الرئيسية)، ورابط المنيو.
 */

import { SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE } from './seoConfig';

/** كيان الموقع — يظهر في كل الصفحات العامة */
export const buildWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'ar-EG',
});

/** كيان المقهى كنشاط تجاري محلي — بيانات واقعية فقط */
export const buildCafeSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'CafeCoffeeShop',
  name: SITE_NAME,
  url: SITE_URL,
  image: DEFAULT_OG_IMAGE,
  description:
    'كافيه تراثي في ههيا بالشرقية، يقدم قهوة بلدي على الرمل وشاي وعصائر طازجة في أجواء دافئة ومميزة.',
  servesCuisine: ['قهوة', 'مشروبات ساخنة', 'عصائر طازجة'],
  priceRange: 'EGP',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'ههيا، الشرقية',
    addressCountry: 'EG',
  },
  hasMenu: `${SITE_URL}/menu`,
});

/** صفحة المنيو — WebPage + Breadcrumb */
export const buildMenuPageSchemas = () => [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'منيو المشروبات والأسعار',
    url: `${SITE_URL}/menu`,
    inLanguage: 'ar-EG',
    isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    about: { '@type': 'CafeCoffeeShop', name: SITE_NAME },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'المنيو', item: `${SITE_URL}/menu` },
    ],
  },
];
