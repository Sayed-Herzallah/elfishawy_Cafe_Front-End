import { useEffect } from 'react';
import { SITE_URL, SITE_NAME, SITE_LANGUAGE, DEFAULT_OG_IMAGE, DEFAULT_OG_IMAGE_ALT, PageSeoMeta } from './seoConfig';

interface UsePageSEOOptions {
  meta: PageSeoMeta;
  /** مخططات JSON-LD خاصة بالصفحة (تُضاف وتُنظف تلقائياً) */
  jsonLd?: object[];
}

const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

/**
 * نظام SEO مركزي لصفحات SPA
 * --------------------------
 * يضبط لكل صفحة: العنوان، الوصف، robots، الـcanonical، وسوم Open Graph
 * وTwitter، ومخططات JSON-LD — وينظّف كل ما أضافه عند مغادرة الصفحة.
 *
 * ملاحظة: وسوم index.html الثابتة تخدم الزحف الأول، وهذا الهوك
 * يحدّثها عند التنقل بين الصفحات (Google يعرض الـJS).
 */
export const usePageSEO = ({ meta, jsonLd = [] }: UsePageSEOOptions) => {
  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${meta.path === '/' ? '' : meta.path}`;
    const image = meta.image || DEFAULT_OG_IMAGE;

    document.title = meta.title;

    upsertMeta('name', 'description', meta.description);
    upsertMeta('name', 'robots', meta.robots || 'index, follow');

    upsertLink('canonical', canonicalUrl);

    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', image);
    upsertMeta('property', 'og:image:alt', DEFAULT_OG_IMAGE_ALT);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('property', 'og:locale', SITE_LANGUAGE);

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', image);

    // JSON-LD خاص بالصفحة — يُنظف عند الخروج حتى لا تتراكم المخططات
    const scripts: HTMLScriptElement[] = jsonLd.map((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-page-seo', 'true');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      scripts.forEach((script) => script.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta.path]);
};
