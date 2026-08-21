 import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Github, Linkedin, Mail, Code2, User, Coffee } from 'lucide-react';

const teamMembers = [
  {
    name: 'Sayed Herzallah',
    role: 'السيد حرز الله',
    title: 'Full Stack Developer',
    bio: 'مطور برمجيات متكامل متخصص في بناء تطبيقات الويب الحديثة. يتمتع بخبرة واسعة في تطوير الأنظمة الإدارية ونقاط البيع باستخدام أحدث التقنيات.',
    email: 'sayed.herzallah@elfishawy.com',
    github: 'github.com/sayedherzallah',
    linkedin: 'linkedin.com/in/sayedherzallah',
    color: 'from-[#2e5b9f] to-[#1e3e70]',
    icon: <Code2 className="w-6 h-6" />,
  },
  {
    name: 'Hanaa Mohamed',
    role: 'هناء محمد',
    title: 'Frontend Developer',
    bio: 'مطورة واجهات أمامية متخصصة في تصميم تجارب المستخدم الجميلة والوظيفية. شغوفة بتحويل الأفكار المعقدة إلى واجهات بسيطة وسهلة الاستخدام.',
    email: 'hanaa.mohamed@elfishawy.com',
    github: 'github.com/hanaamohamed',
    linkedin: 'linkedin.com/in/hanaamohamed',
    color: 'from-[#9f1239] to-[#6d0d28]',
    icon: <User className="w-6 h-6" />,
  },
];

export const AboutPage: React.FC = () => {
  return (
    <div className="flex flex-col text-[#1c1917] font-sans">
      {/* Hero Section */}
      <section className="relative py-20 px-6 bg-[#1c2430] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2e5b9f]/20 via-transparent to-[#9f1239]/20" />
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-2">
            <Coffee className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-arabic-heading leading-tight">
            فريق تطوير {' '}
            <span className="text-blue-300">مقهى الفيشاوي</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            نحن فريق من المطورين المبدعين الذين بنوا نظام إدارة المقهى بالكامل - من نقطة البيع إلى لوحات التحكم والتقارير المالية.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#2e5b9f] hover:bg-[#244b85] text-white font-bold py-2.5 px-6 rounded-xl transition-all text-sm mt-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة إلى الرئيسية</span>
          </Link>
        </div>
      </section>

      {/* Team Members */}
      <section className="py-16 px-6 max-w-5xl mx-auto w-full">
        <div className="text-right mb-10">
          <h2 className="text-2xl md:text-3xl font-bold font-arabic-heading text-gray-900">
            فريق التطوير
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            المطورون الذين قاموا ببناء هذا النظام بالكامل
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamMembers.map((member, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group"
            >
              {/* Card Header with Gradient */}
              <div className={`bg-gradient-to-br ${member.color} p-6 text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                      {member.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{member.name}</h3>
                      <p className="text-sm text-white/80">{member.role}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono bg-white/15 backdrop-blur-sm border border-white/20 px-2.5 py-1 rounded-lg">
                    {member.title}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-gray-600 leading-relaxed text-right">
                  {member.bio}
                </p>

                {/* Contact Info */}
                <div className="space-y-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-[#2e5b9f]" />
                    <span className="font-mono">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Github className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-mono">{member.github}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Linkedin className="w-3.5 h-3.5 text-[#0a66c2]" />
                    <span className="font-mono">{member.linkedin}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-12 px-6 max-w-4xl mx-auto w-full">
        <div className="bg-[#f9f6f0] rounded-3xl border border-gray-200 p-8 md:p-10 text-center">
          <h3 className="text-xl md:text-2xl font-bold font-arabic-heading text-gray-900">
            نظام متكامل لإدارة المقهى
          </h3>
          <p className="text-xs text-gray-600 mt-2 max-w-lg mx-auto leading-relaxed">
            صُمم هذا النظام بأحدث التقنيات ليكون سريعاً وآمناً وقابلاً للتوسع، مع التركيز على تجربة مستخدم سلسة لكل من الكاشير والمدير.
          </p>
        </div>
      </section>
    </div>
  );
};