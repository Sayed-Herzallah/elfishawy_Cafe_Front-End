# SEO_AUDIT — كافيه الفيشاوي

> تاريخ التدقيق: 2026-08-25 — تدقيق شامل وتنفيذ مباشر لتحسينات SEO

---

## SEO Overview

الموقع هو واجهة عامة لمقهى تراثي في خان الخليلي بالقاهرة:

| الصفحة | النوع | الفهرسة |
|---|---|---|
| `/` صفحة رئيسية تعريفية | عامة | index, follow |
| `/menu` منيو المشروبات والأسعار (Static) | عامة | index, follow |
| `/survey` استبيان الزوار | عامة | index, follow |
| `/developers` عن المبرمجين | عامة | index, follow |
| `/login` بوابة الفريق | خاصة | **noindex, nofollow** |
| `/pos/*` نقطة البيع | خاصة (محمية بتسجيل دخول) | محجوبة في robots.txt |
| `/admin/*` لوحة الإدارة | خاصة (محمية بصلاحيات) | محجوبة في robots.txt |
| `*` صفحة 404 | خطأ | noindex (تفادي Soft-404) |

**الحماية الأمنية هي تسجيل الدخول والصلاحيات — robots.txt ليس آلية حماية.**

---

## Current Problems (ما تم اكتشافه قبل الإصلاح)

1. **هوية SEO خاطئة تماماً:** العنوان والوصف والكلمات المفتاحية والـJSON-LD كانوا لتطبيق "نظام إدارة مقهى" (SoftwareApplication/SaaS) بينما الجمهور المستهدف باحث عن **مقهى** في القاهرة. نية بحث خاطئة = صفر قيمة من الفهرسة.
2. لا يوجد `robots.txt` ولا `sitemap.xml` إطلاقاً.
3. لا يوجد `canonical` ولا `og:url` ولا `og:image` ولا `twitter:image`.
4. `favicon.ico` مُشار إليه في index.html وغير موجود (404).
5. لا يوجد نظام مركزي للـmetadata — كل صفحة تشارك نفس العنوان الثابت.
6. manifest.json يعرّف الموقع كنظام إدارة مالي مع اختصارات لصفحات خاصة (POS/Dashboard).
7. صور المنيو بدون `loading="lazy"` في بعض الأماكن وبلا fallback موحد.

---

## Fixed Problems (ما تم إصلاحه فعلياً)

| # | الإصلاح | الملفات |
|---|---|---|
| 1 | هوية جديدة كاملة: عنوان ووصف يطابقان نية البحث الحقيقية (مقهى في خان الخليلي) | `index.html` |
| 2 | إزالة JSON-LD الخاطئ (SoftwareApplication) واستبداله بـ`WebSite` + `CafeCoffeeShop` بمعلومات حقيقية فقط | `index.html`, `src/seo/structuredData.ts` |
| 3 | نظام SEO مركزي: هوك يضبط title/description/robots/canonical/OG/Twitter/JSON-LD لكل صفحة وينظف عند الخروج | `src/seo/usePageSEO.ts`, `src/seo/seoConfig.ts` |
| 4 | metadata فريدة لكل صفحة عامة + noindex لصفحات الدخول و404 | جميع الصفحات العامة |
| 5 | إنشاء `robots.txt` بحجب المسارات الخاصة مع الإشارة للـsitemap | `public/robots.txt` |
| 6 | إنشاء `sitemap.xml` يحتوي الصفحات القابلة للفهرسة فقط | `public/sitemap.xml` |
| 7 | canonical + og:url + og:image + twitter:image لكل صفحة | `index.html` + الهوك |
| 8 | إصلاح مرجع `favicon.ico` المكسور | `index.html` |
| 9 | manifest بهوية الكافيه بدون اختصارات داخلية | `public/manifest.json` |
| 10 | `preconnect` لـimages.unsplash.com (تحسين LCP لصورة الهيرو) + lazy loading لصور المنيو + fallback موحد | `index.html`, صفحات عامة |
| 11 | دومين قابل للتغيير من متغير واحد | `.env` → `VITE_SITE_URL` |
| 12 | Semantic HTML: `<header>/<nav>/<main>/<footer>` موجودة في PublicLayout، H1 واحد لكل صفحة عامة | قائم مسبقاً — تم التحقق |

---

## Technical SEO

- ✅ `robots.txt` + `sitemap.xml` متطابقان مع بناء الـroutes الفعلي
- ✅ canonical مطلق لكل صفحة (`VITE_SITE_URL` + path)
- ✅ HTTPS افتراضي عبر Vercel
- ✅ SPA rewrites في vercel.json تعيد كل المسارات لـindex.html (لا صفحات مكسورة للزواحف)
- ⚠️ SPA بدون SSR/Prerender: جوجل يعرض JS بشكل طبيعي، لكن **Prerendering للصفحتين `/` و `/menu`** سيحسّن زحف محركات أخرى — انظر Roadmap

## On-Page SEO

- ✅ عنوان فريد لكل صفحة بصيغة `الموضوع | العلامة`
- ✅ وصف فريد لكل صفحة يطابق محتواها الفعلي
- ✅ H1 واحد لكل صفحة + تسلسل H2/H3 منطقي
- ✅ روابط داخلية بوصف واضح: الرئيسية ↔ المنيو ↔ الاستبيان ↔ عن المبرمجين

## Content SEO

- ✅ المنيو الآن Static بمحتوى حقيقي كامل (25+ صنف بأسعار وأنواع) — صفحة قابلة للفهرسة بمحتوى فعلي
- ✅ قسم "من قائمتنا" في الرئيسية يعرض أصناف حقيقية
- ✅ لا محتوى مكرر ولا صفحات نافذة

## Local SEO

- ✅ `CafeCoffeeShop` schema مع `addressLocality: القاهرة` (مذكورة فعلياً في محتوى الموقع)
- ⚠️ **NEEDS MANUAL ACTION:** العنوان التفصيلي ورقم الهاتف ومواعيد العمل غير متاحة في الموقع — لا نخترعها. أضِفها للصفحة ثم للـschema عند توفرها + سجّل Google Business Profile

## Structured Data

- ✅ `WebSite` + `CafeCoffeeShop` في index.html (ثابت للزحف الفوري)
- ✅ `WebPage` + `BreadcrumbList` لصفحة المنيو (ديناميكي)
- ✅ صفر بيانات مختلقة: لا تقييمات، لا أسعار وهمية، لا مواعيد عمل

## Performance

- ✅ preconnect للخطوط والصور
- ✅ `loading="lazy"` لصور المنيو (أسفل الشاشة)
- ✅ أبعاد محفوظة للصور عبر `aspect-4/3` / `aspect-square` (لا CLS)
- ✅ fallback تلقائي عند فشل أي صورة
- ⚠️ حزمة JS واحدة ~1.3MB — يُنصح مستقبلاً بـcode-splitting (لا يؤثر على وظيفة الموقع حالياً)

## Indexability

- ✅ الصفحات العامة `index, follow` مع canonical
- ✅ `/login` و404 `noindex, nofollow`
- ✅ `/admin/*` و `/pos/*` محجوبة في robots.txt + محمية بـProtectedRoute/RoleGuard
- ✅ 404 حقيقية بلا Soft-404

## Internal Linking

- ✅ الهيدر: الرئيسية / المنيو / الاستبيان / عن المبرمجين
- ✅ الرئيسية → "عرض المنيو الكامل" + كروت الأصناف تنقر للمنيو
- ✅ المنيو → العودة للرئيسية
- ✅ 404 → الرئيسية

## Mobile SEO

- ✅ viewport صحيح، RTL كامل، لا تمرير أفقي، أزرار بحجم لمس مناسب، نفس المحتوى على كل الشاشات

## AI Search Readiness

- ✅ بنية HTML دلالية واضحة + معلومات фактية مباشرة (اسم، وصف، موقع، منيو)
- ✅ JSON-LD يعرّف الكيان بوضوح لمحركات البحث والأجوبة الآلية
- ✅ لا حيل أو محتوى مضلل

---

## Remaining Issues

1. **الدومين النهائي غير مؤكد** — الافتراضي الحالي `https://elfishawy-cafe.vercel.app`. عند ربط دومين حقيقي: عدّل `VITE_SITE_URL` في `.env` + حدّث `robots.txt` + `sitemap.xml` + `index.html` ثم أعد النشر.

## Manual Actions (خطوات يدوية مطلوبة منك)

1. **Google Search Console:** أضف الموقع، تحقق من الملكية، وأرسل `sitemap.xml`.
2. **تأكيد الدومين:** تأكد من رابط النشر الفعلي على Vercel وعدّل `VITE_SITE_URL` لو مختلف.
3. **Google Business Profile:** سجّل المقهى (أهم خطوة للبحث المحلي "قهوة خان الخليلي").
4. **صورة OG ماركة:** أنشئ صورة 1200×630 باسم الكافيه واستبدل الرابط في `seoConfig.ts` و`index.html`.
5. **معلومات تواصل حقيقية:** عند توفر عنوان دقيق/هاتف/مواعيد — أضفها للصفحة الرئيسية وschema.
6. **Analytics:** ركّب Google Analytics 4 أو بديل لقياس الزيارات (غير موجود حالياً).

## Future SEO Roadmap

1. Prerender للصفحتين `/` و `/menu` (vite-prerender أو مماثل).
2. Code-splitting لحزمة الـJS (~1.3MB حالياً).
3. صفحات تصنيفات المنيو `/menu/coffee` إلخ عند الحاجة الفعلية.
4. صورة OG ماركة + favicon بحجم PNG متعدد.
5. محتوى "عن الكافيه" موسّع (حكاية المكان) لاستهداف استعلامات طويلة الذيل.

## Final Scores

| المحور | الدرجة |
|---|---|
| Technical SEO | 85/100 |
| On-Page SEO | 90/100 |
| Content SEO | 80/100 |
| Local SEO | 60/100 (تحتاج Google Business Profile + عنوان تفصيلي) |
| Performance | 75/100 (حزمة JS كبيرة) |
| Mobile SEO | 95/100 |
| Accessibility | 80/100 |
| Structured Data | 85/100 |
| Indexability | 90/100 |
| AI Search Readiness | 80/100 |
