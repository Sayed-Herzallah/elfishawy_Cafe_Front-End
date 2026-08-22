import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Code2,
  Github,
  Linkedin,
  Mail,
  Star,
  Layers,
  Server,
  Database,
  Palette,
  Monitor,
  Globe,
} from "lucide-react";

interface Developer {
  name: string;
  nameEn: string;
  role: string;
  badge: string;
  icon: React.ReactNode;
  bio: string;
  highlights: { text: string }[];
  skills: string[];
  accentFrom: string;
  accentTo: string;
  social: {
    github?: string;
    linkedin?: string;
    email: string;
    portfolio?: string;
    behance?: string;
  };
}

/** أيقونة Behance (مش موجودة في lucide) */
const BehanceIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M16.969 16.927a2.561 2.561 0 0 0 1.901.677 2.501 2.501 0 0 0 1.531-.475c.362-.235.636-.584.779-.99h2.585a5.091 5.091 0 0 1-1.9 2.896 5.292 5.292 0 0 1-3.091.88 5.839 5.839 0 0 1-2.284-.433 4.871 4.871 0 0 1-1.723-1.211 5.657 5.657 0 0 1-1.08-1.874 7.057 7.057 0 0 1-.383-2.393c-.005-.8.129-1.594.396-2.349a5.313 5.313 0 0 1 5.088-3.604 4.87 4.87 0 0 1 2.376.563c.661.362 1.231.87 1.668 1.485a6.2 6.2 0 0 1 .943 2.133c.194.821.263 1.666.205 2.508h-7.678c-.063.79.184 1.574.688 2.187ZM6.947 4.084a8.065 8.065 0 0 1 1.928.198 4.29 4.29 0 0 1 1.49.638c.418.303.748.71.959 1.182.241.579.357 1.203.339 1.83a3.506 3.506 0 0 1-.473 1.932 3.726 3.726 0 0 1-1.455 1.287 3.588 3.588 0 0 1 1.958 1.408c.443.681.665 1.483.635 2.295a4.653 4.653 0 0 1-.461 2.126 3.942 3.942 0 0 1-1.258 1.436 5.598 5.598 0 0 1-1.807.79 8.273 8.273 0 0 1-2.075.25H0V4.084h6.947Zm10.955 1.91a2.157 2.157 0 0 1-1.741-.684 2.43 2.43 0 0 1-.573-1.622 2.318 2.318 0 0 1 .593-1.62 2.125 2.125 0 0 1 1.664-.657 2.2 2.2 0 0 1 1.688.64 2.256 2.256 0 0 1 .601 1.636 2.207 2.207 0 0 1-.593 1.622 2.128 2.128 0 0 1-1.64.684v.001Zm-9.896 3.63a2.155 2.155 0 0 0 1.317-.383 1.505 1.505 0 0 0 .512-1.273 1.612 1.612 0 0 0-.166-.78 1.309 1.309 0 0 0-.448-.482 1.918 1.918 0 0 0-.65-.24 4.63 4.63 0 0 0-.764-.07H3.24v3.23h3.764v-.002Zm.195 3.854a5.147 5.147 0 0 0-.84-.07H3.24v3.81h3.752c.382 0 .748-.036 1.11-.11a2.63 2.63 0 0 0 .914-.365c.264-.168.48-.4.626-.674.163-.315.241-.666.228-1.02a2.144 2.144 0 0 0-.704-1.765 3.149 3.149 0 0 0-.97-.326h.001Z" />
  </svg>
);

/** صف أزرار التواصل - يعرض فقط الروابط المعبأة */
const SocialLinks: React.FC<{ social: Developer["social"] }> = ({ social }) => {
  const links = [
    {
      title: "البورتفوليو",
      href: social.portfolio,
      hover: "hover:bg-blue-50 hover:text-[#2e5b9f]",
      icon: <Globe className="w-4 h-4" />,
    },
    {
      title: "البريد الإلكتروني",
      href: social.email,
      hover: "hover:bg-rose-50 hover:text-rose-600",
      icon: <Mail className="w-4 h-4" />,
    },
    {
      title: "LinkedIn",
      href: social.linkedin,
      hover: "hover:bg-blue-50 hover:text-blue-700",
      icon: <Linkedin className="w-4 h-4" />,
    },
    {
      title: "GitHub",
      href: social.github,
      hover: "hover:bg-gray-200",
      icon: <Github className="w-4 h-4" />,
    },
    {
      title: "Behance",
      href: social.behance,
      hover: "hover:bg-blue-50 hover:text-[#1769ff]",
      icon: <BehanceIcon className="w-4 h-4" />,
    },
  ].filter((link) => !!link.href);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
      {links.map((link) => (
        <a
          key={link.title}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`p-2 rounded-xl bg-gray-100 text-gray-500 transition-colors ${link.hover}`}
          title={link.title}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
};

export const AboutDevelopersPage: React.FC = () => {
  const developers: Developer[] = [
    {
      name: "السيد حرزالله",
      nameEn: "Sayed Herzallah",
      role: "مطور Full Stack",
      badge: "Full Stack Developer",
      icon: <Code2 className="w-9 h-9" />, // شكل كود </> بدل الحروف
      bio: "متخصص في بناء تطبيقات الويب الكاملة من Frontend إلى Backend. يمتلك خبرة عميقة في React, TypeScript, Node.js وقواعد البيانات. مسؤول عن بناء نظام إدارة كافيه الفيشاوي بالكامل من الصفر شاملاً لوحة الإدارة ونقطة البيع والـ API ومنطق العمل.",
      highlights: [
        { text: "Backend API & Database" },
        { text: "Dashboard & POS System" },
        { text: "System Architecture" },
      ],
      skills: [
  "React",
  "Next.js",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Nest.js",
  "Express.js",
  "MongoDB",
  "Mongoose",
  "Tailwind CSS",
  "RESTful APIs",
  "GraphQL",
  "System Design",
  "Software Architecture",
  "Authentication & Authorization",
  "JWT",
  "Role-Based Access Control",
  "Payment Integration",
  "Real-time Features",
  "WebSockets",
  "API Integration",
  "Database Design",
  "Data Validation",
  "Error Handling",
  "Testing & Debugging",
  "Git & GitHub",
  "Deployment & CI/CD",
  "Performance Optimization",
  "Security Best Practices",
  "Responsive Web Design",
  "C#",
  "SQL",
  "Docker",
  "Cloud Services",
  "Sequelize",
  "Redux Toolkit",
"Unit Testing",
"Microservices Architecture"
],
     
      accentFrom: "from-[#2e5b9f]",
      accentTo: "to-blue-700",
      social: {
        github: "https://github.com/Sayed-Herzallah",
        linkedin: "https://www.linkedin.com/in/sayed-herzallah/",
        email: "mailto:herzallahdeveloper@gmail.com",
        portfolio: "https://herzallah.me",
      },
    },
    {
      name: "هناء محمد",
      nameEn: "Hanaa Mohammed",
      role: "مصممة UI/UX",
      badge: "UI/UX Designer",
      icon: <Palette className="w-9 h-9" />, // رمز تصميم بدل الحروف
      bio: "مصممة متخصصة في تجربة المستخدم وتصميم الواجهات العربية RTL. تحول المتطلبات الوظيفية إلى تجارب بصرية سلسة وجذابة. مسؤولة عن الهوية البصرية لنظام الفيشاوي والتجربة الكاملة للمستخدم على مختلف الأجهزة.",
      highlights: [
        { text: "Figma Design System" },
        { text: "Visual Identity & Branding" },
        { text: "RTL UX & Accessibility" },
      ],
skills: [
  "Figma",
  "UI Design",
  "UX Research",
  "Design Systems",
  "RTL Layouts",
  "Prototyping",
  "User Flows",
  "Wireframing",
  "Interaction Design",
  "Accessibility Standards",
  "Responsive Design",
  "Typography & Color Theory",
  "Visual Storytelling",
  "User-Centered Design",
  "Design Thinking",
  "Website Building & Management",
  "WordPress",
  "Page Builders (Elementor, etc.)",
  "Landing Page Design",
  "Mobile App Design",
  "Component Design",
  "Usability Testing",
  "Information Architecture",
  "Design Handoff",
  "Micro-interactions",
  "Visual Hierarchy",
  "Content Structure",
  "Design Consistency",
  "Cross-Platform Design",
  "Web Performance Awareness",
],
      accentFrom: "from-rose-700",
      accentTo: "to-pink-700",
      // أيقونات التواصل لهناء: الإيميل و Behance فقط
      social: {
        email: "mailto:hanaamahmoud186@gmail.com",
        behance: "https://www.behance.net/hanaamahmoud7",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#1c1917] pb-24">
      <div className="relative min-h-[320px] bg-gray-950 text-white flex items-center justify-center overflow-hidden px-6">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1600&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/60" />
        <div className="relative z-10 text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-white/80 mb-2">
            <Code2 className="w-3.5 h-3.5" />
            <span>فريق التطوير والتصميم</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-arabic-heading leading-tight">
            العقول خلف الفيشاوي
          </h1>
          <p className="text-lg text-white/75 max-w-xl mx-auto leading-relaxed">
            مطور Full Stack ومصممة UI/UX بنيا هذا النظام بالكامل بأحدث التقنيات
            وأعلى معايير الجودة
          </p>
          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>العودة إلى الرئيسية</span>
            </Link>
          </div>
        </div>
      </div>

      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {developers.map((dev) => (
            <article
              key={dev.name}
              className="bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div
                className={`bg-gradient-to-l ${dev.accentFrom} ${dev.accentTo} p-6 text-white relative overflow-hidden`}
              >
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-white/15 shadow-md ring-2 ring-white/30 shrink-0 flex items-center justify-center text-white">
                    {dev.icon}
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <h3 className="text-xl font-bold font-arabic-heading leading-snug">
                      {dev.name}
                    </h3>
                    <p className="text-sm text-white/75 font-mono mt-0.5">
                      {dev.nameEn}
                    </p>
                    <span className="inline-block mt-2 text-[10px] font-bold bg-white/20 border border-white/25 px-2.5 py-0.5 rounded-full tracking-wide">
                      {dev.badge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-sm text-gray-700 leading-relaxed text-right">
                  {dev.bio}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  {dev.highlights.map((h, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100"
                    >
                      <div className="flex items-center justify-center text-[#2e5b9f] mb-1.5">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 leading-tight block">
                        {h.text}
                      </span>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 text-right flex items-center justify-end gap-1">
                    <span>التقنيات والمهارات</span>
                    <Code2 className="w-3.5 h-3.5 text-[#2e5b9f]" />
                  </h4>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {dev.skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-block px-2.5 py-1 rounded-lg bg-[#f0ebe1] text-[#2e5b9f] text-[11px] font-bold border border-[#2e5b9f]/15"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <SocialLinks social={dev.social} />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-l from-[#2e5b9f] to-blue-700 rounded-3xl p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Star className="w-7 h-7 text-yellow-300" />
              <h3 className="text-2xl md:text-3xl font-bold font-arabic-heading">
                مقهى الفيشاوي
              </h3>
              <Star className="w-7 h-7 text-yellow-300" />
            </div>
            <p className="text-base text-white/85 max-w-2xl mx-auto leading-relaxed">
              نظام إدارة متكامل يضم: لوحة الإدارة، نقطة البيع (POS)، إدارة
              المخزون والوصفات، تتبع المصروفات، والتقارير المالية التفصيلية.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/75 pt-2">
             
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 rounded-full">
                <Monitor className="w-3.5 h-3.5" />
                React 18 + TypeScript
              </span>

              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 rounded-full">
                <Server className="w-3.5 h-3.5" />
                Node.js + Express + MongoDB
              </span>

              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 rounded-full">
                <Layers className="w-3.5 h-3.5" />
                GraphQL + REST API
              </span>

              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 rounded-full">
                <Layers className="w-3.5 h-3.5" />
                Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
