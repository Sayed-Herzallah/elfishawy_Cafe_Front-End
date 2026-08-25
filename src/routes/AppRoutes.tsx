import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { CashierLayout } from '../components/layout/CashierLayout';

import { LandingPage } from '../pages/LandingPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// ⚡ تقسيم الكود: الصفحة الرئيسية فقط تُحمّل مع الحزمة الأولى (صفحة الـLCP) —
// باقي الصفحات (ومعها مكتبات recharts وjspdf الثقيلة) تُحمّل عند الطلب فقط،
// وده بيقلل حجم JavaScript الأولي وبيسرّع أول عرض بشكل كبير على الموبايل.
const PublicMenuPage = lazy(() => import('../pages/PublicMenuPage').then((m) => ({ default: m.PublicMenuPage })));
const SurveyPage = lazy(() => import('../pages/SurveyPage').then((m) => ({ default: m.SurveyPage })));
const AboutDevelopersPage = lazy(() => import('../pages/AboutDevelopersPage').then((m) => ({ default: m.AboutDevelopersPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));

const CashierPOSPage = lazy(() => import('../pages/CashierPOSPage').then((m) => ({ default: m.CashierPOSPage })));
const CashierOrdersTrackerPage = lazy(() => import('../pages/cashier/CashierOrdersTrackerPage').then((m) => ({ default: m.CashierOrdersTrackerPage })));
const CashierInventoryPage = lazy(() => import('../pages/cashier/CashierInventoryPage').then((m) => ({ default: m.CashierInventoryPage })));
const CashierExpensesPage = lazy(() => import('../pages/cashier/CashierExpensesPage').then((m) => ({ default: m.CashierExpensesPage })));

const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminInventoryPage = lazy(() => import('../pages/admin/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage })));
const AdminSalesPage = lazy(() => import('../pages/admin/AdminSalesPage').then((m) => ({ default: m.AdminSalesPage })));
const AdminExpensesPage = lazy(() => import('../pages/admin/AdminExpensesPage').then((m) => ({ default: m.AdminExpensesPage })));
const AdminReportsPage = lazy(() => import('../pages/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage })));

// غلاف آمن لكل صفحة: أي خطأ Runtime يظهر كرسالة واضحة بدل الصفحة البيضاء
const SafePage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          {/* نسخة مصغرة من هوية الفيشاوي المتحركة — اتساق مع شاشة الدخول */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#2e5b9f]/40 animate-brand-spin" />
            <div className="absolute inset-1.5 rounded-full border border-dotted border-[#2e5b9f]/25 animate-brand-spin-reverse" />
            <Coffee className="w-7 h-7 text-[#2e5b9f] animate-brand-float" />
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  </ErrorBoundary>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<SafePage><PublicMenuPage /></SafePage>} />
        <Route path="/survey" element={<SafePage><SurveyPage /></SafePage>} />
        <Route path="/developers" element={<SafePage><AboutDevelopersPage /></SafePage>} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<SafePage><LoginPage /></SafePage>} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* POS & Cashier Portal (Accessible by both Cashiers and Admins) */}
        <Route path="/pos" element={<CashierLayout />}>
          <Route index element={<SafePage><CashierPOSPage /></SafePage>} />
          <Route path="orders" element={<SafePage><CashierOrdersTrackerPage /></SafePage>} />
          <Route path="inventory" element={<SafePage><CashierInventoryPage /></SafePage>} />
          <Route path="expenses" element={<SafePage><CashierExpensesPage /></SafePage>} />
        </Route>

        {/* Admin Portal — للأدمن فقط (الكاشير يُحوَّل تلقائياً إلى /pos) */}
        <Route element={<RoleGuard allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<SafePage><AdminDashboardPage /></SafePage>} />
            <Route path="products" element={<SafePage><AdminProductsPage /></SafePage>} />
            <Route path="categories" element={<SafePage><AdminCategoriesPage /></SafePage>} />
            <Route path="inventory" element={<SafePage><AdminInventoryPage /></SafePage>} />
            <Route path="sales" element={<SafePage><AdminSalesPage /></SafePage>} />
            <Route path="expenses" element={<SafePage><AdminExpensesPage /></SafePage>} />
            <Route path="reports" element={<SafePage><AdminReportsPage /></SafePage>} />
            <Route path="settings" element={<SafePage><AdminSettingsPage /></SafePage>} />
          </Route>
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
