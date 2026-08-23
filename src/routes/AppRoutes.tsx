import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { CashierLayout } from '../components/layout/CashierLayout';

import { LandingPage } from '../pages/LandingPage';
import { PublicMenuPage } from '../pages/PublicMenuPage';
import { SurveyPage } from '../pages/SurveyPage';
import { AboutDevelopersPage } from '../pages/AboutDevelopersPage';
import { LoginPage } from '../pages/LoginPage';
import { CashierPOSPage } from '../pages/CashierPOSPage';
import { CashierOrdersTrackerPage } from '../pages/cashier/CashierOrdersTrackerPage';
import { CashierInventoryPage } from '../pages/cashier/CashierInventoryPage';
import { CashierExpensesPage } from '../pages/cashier/CashierExpensesPage';

import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminInventoryPage } from '../pages/admin/AdminInventoryPage';
import { AdminSalesPage } from '../pages/admin/AdminSalesPage';
import { AdminExpensesPage } from '../pages/admin/AdminExpensesPage';
import { AdminReportsPage } from '../pages/admin/AdminReportsPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';

import { NotFoundPage } from '../pages/NotFoundPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

// غلاف آمن لكل صفحة: أي خطأ Runtime يظهر كرسالة واضحة بدل الصفحة البيضاء
const SafePage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
);

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<SafePage><LandingPage /></SafePage>} />
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