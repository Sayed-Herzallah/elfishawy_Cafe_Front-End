 import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/developers', label: 'عن المبرمجين' },
    { to: '/menu', label: 'منيو' },
    { to: '/survey', label: 'الاستبيان' },
  ];

  return (
    <div className="min-h-screen bg-[#fcfaf7] flex flex-col text-[#1c1917] font-sans antialiased selection:bg-[#2e5b9f] selection:text-white">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-40 bg-[#1c2430]/90 backdrop-blur-md text-white border-b border-white/10 px-6 py-4 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Name */}
          <Link to="/" className="text-xl font-bold font-arabic-heading tracking-wide hover:opacity-90 transition">
            {'كافيه الفيشاوي'}
          </Link>

          {/* Mobile Menu Toggle (lg and below) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white hover:text-blue-300 rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="القائمة"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Navigation Links (Desktop lg+) */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition-colors hover:text-blue-300 ${
                  location.pathname === link.to ? 'text-blue-400 font-bold' : 'text-gray-200'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action: Portal / Login (Desktop lg+) */}
          <div className="hidden lg:flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={isAdmin ? '/admin' : '/pos'}
                className="bg-[#2e5b9f] hover:bg-[#244b85] text-white text-xs font-bold py-2 px-4 rounded-xl transition shadow-sm"
              >
                {isAdmin ? 'لوحة التحكم' : 'نقطة البيع (POS)'}
              </Link>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-white hover:text-blue-300 transition flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-white/5"
              >
                <span>تسجيل الدخول</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile / Tablet Dropdown Menu (md and below) */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-2 border-t border-white/10 pt-3 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block py-2.5 px-3 rounded-xl text-sm font-bold transition ${
                  location.pathname === link.to
                    ? 'bg-[#2e5b9f] text-white'
                    : 'text-gray-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="pt-2 mt-2 border-t border-white/10">
              {isAuthenticated ? (
                <Link
                  to={isAdmin ? '/admin' : '/pos'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-[#2e5b9f] hover:bg-[#244b85] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-sm"
                >
                  {isAdmin ? 'لوحة التحكم' : 'نقطة البيع (POS)'}
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center bg-white/10 hover:bg-white/20 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition"
                >
                  تسجيل الدخول
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Public Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-[#244b85] text-white text-xs py-6 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-blue-100/90 font-medium">
            {'قهوة معمولة بمزاج. كافيه الفيشاوي © '}{new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6 text-blue-200">
            <Link to="/developers" className="hover:underline">عن المبرمجين</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};