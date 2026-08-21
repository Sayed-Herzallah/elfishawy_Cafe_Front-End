import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Code2, Github, Linkedin, Mail, Star, Layers, Server, Database, Palette, Monitor } from "lucide-react";

interface Developer {
  name: string;
  nameEn: string;
  role: string;
  badge: string;
  photo: string;
  bio: string;
  highlights: { text: string }[];
  skills: string[];
  accentFrom: string;
  accentTo: string;
  social: { github: string; linkedin: string; email: string  ; portfolio: string };
}

export const AboutDevelopersPage: React.FC = () => {
  const developers: Developer[] = [
    {
      name: "السيد حرزالله",
      nameEn: "Sayed Herzallah",
      role: "مطور Full Stack",
      badge: "Full Stack Developer",
      photo: "https://api.dicebear.com/9.x/initials/svg?seed=SH&backgroundColor=2e5b9f&fontFamily=Arial&fontSize=40&textColor=ffffff",
      bio: "متخصص في بناء تطبيقات الويب الكاملة من Frontend إلى Backend. يمتلك خبرة عميقة في React, TypeScript, Node.js وقواعد البيانات. مسؤول عن بناء نظام إدارة كافيه الفيشاوي بالكامل من الصفر شاملاً لوحة الإدارة ونقطة البيع والـ API ومنطق العمل.",
      highlights: [
        { text: "Backend API & Database" },
        { text: "Dashboard & POS System" },
        { text: "System Architecture" },
      ],
      skills: ["React", "TypeScript", "Node.js", "MongoDB", "Tailwind CSS", "Express.js"],
      accentFrom: "from-[#2e5b9f]",
      accentTo: "to-blue-700",
      social: { github: "https://github.com/Sayed-Herzallah", linkedin: "https://www.linkedin.com/in/sayed-herzallah/", email: "mailto:herzallahdeveloper@gmail.com", portfolio:"https://herzallah.me" },
    },
    {
      name: "هناء محمد",
      nameEn: "Hanaa Mohamed",
      role: "مصممة UI/UX",
      badge: "UI/UX Designer",
      photo: "https://api.dicebear.com/9.x/initials/svg?seed=HM&backgroundColor=9f1239&fontFamily=Arial&fontSize=40&textColor=ffffff",
      bio: "مصممة متخصصة في تجربة المستخدم وتصميم الواجهات العربية RTL. تحول المتطلبات الوظيفية إلى تجارب بصرية سلسة وجذابة. مسؤولة عن الهوية البصرية لنظام الفيشاوي والتجربة الكاملة للمستخدم على مختلف الأجهزة.",
      highlights: [
        { text: "Figma Design System" },
        { text: "Visual Identity & Branding" },
        { text: "RTL UX & Accessibility" },
      ],
      skills: ["Figma", "UI Design", "UX Research", "Design Systems", "RTL Layouts", "Prototyping"],
      accentFrom: "from-rose-700",
      accentTo: "to-pink-700",
      social: { github: "https://github.com", linkedin: "https://linkedin.com", email: "mailto:hanaa@elfishawy.com", portfolio: "https://elfishawy.com" },
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#1c1917] pb-24">
      <div className="relative min-h-[320px] bg-gray-950 text-white flex items-center justify-center overflow-hidden px-6">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1600&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/60" />
        <div className="relative z-10 text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-bold text-white/80 mb-2">
            <Code2 className="w-3.5 h-3.5" />
            <span>فريق التطوير والتصميم</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-arabic-heading leading-tight">العقول خلف الفيشاوي</h1>
          <p className="text-lg text-white/75 max-w-xl mx-auto leading-relaxed">
            مطور Full Stack ومصممة UI/UX بنيا هذا النظام بالكامل بأحدث التقنيات وأعلى معايير الجودة
          </p>
          <div className="pt-2">
            <Link to="/" className="inline-flex items-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-2.5 px-6 rounded-xl transition text-xs shadow-md">
              <ArrowLeft className="w-4 h-4" />
              <span>العودة إلى الرئيسية</span>
            </Link>
          </div>
        </div>
      </div>

      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {developers.map((dev) => (
            <article key={dev.name} className="bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className={`bg-gradient-to-l ${dev.accentFrom} ${dev.accentTo} p-6 text-white relative overflow-hidden`}>
                <div className="relative z-10 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 shadow-md ring-2 ring-white/30 shrink-0">
                    <img src={dev.photo} alt={dev.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-right flex-1 min-w-0">
                    <h3 className="text-xl font-bold font-arabic-heading leading-snug">{dev.name}</h3>
                    <p className="text-sm text-white/75 font-mono mt-0.5">{dev.nameEn}</p>
                    <span className="inline-block mt-2 text-[10px] font-bold bg-white/20 border border-white/25 px-2.5 py-0.5 rounded-full tracking-wide">
                      {dev.badge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <p className="text-sm text-gray-700 leading-relaxed text-right">{dev.bio}</p>

                <div className="grid grid-cols-3 gap-2">
                  {dev.highlights.map((h, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-2.5 text-center border border-gray-100">
                      <div className="flex items-center justify-center text-[#2e5b9f] mb-1.5">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 leading-tight block">{h.text}</span>
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
                      <span key={skill} className="inline-block px-2.5 py-1 rounded-lg bg-[#f0ebe1] text-[#2e5b9f] text-[11px] font-bold border border-[#2e5b9f]/15">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <a href={dev.social.email} className="p-2 rounded-xl bg-gray-100 hover:bg-rose-50 hover:text-rose-600 text-gray-500 transition-colors" title="البريد الإلكتروني">
                    <Mail className="w-4 h-4" />
                  </a>
                  <a href={dev.social.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-500 transition-colors" title="LinkedIn">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a href={dev.social.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors" title="GitHub">
                    <Github className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-l from-[#2e5b9f] to-blue-700 rounded-3xl p-8 text-white text-center relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Star className="w-7 h-7 text-yellow-300" />
              <h3 className="text-2xl md:text-3xl font-bold font-arabic-heading">مقهى الفيشاوي</h3>
              <Star className="w-7 h-7 text-yellow-300" />
            </div>
            <p className="text-base text-white/85 max-w-2xl mx-auto leading-relaxed">
              نظام إدارة متكامل يضم: لوحة الإدارة، نقطة البيع (POS)، إدارة المخزون والوصفات، تتبع المصروفات، والتقارير المالية التفصيلية.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/75 pt-2">
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 rounded-full">
                <Monitor className="w-3.5 h-3.5" />
                React 18 + TypeScript
              </span>
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 rounded-full">
                <Server className="w-3.5 h-3.5" />
                Node.js + MongoDB
              </span>
              <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/15 rounded-full">
                <Layers className="w-3.5 h-3.5" />
                RTL First Design
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
