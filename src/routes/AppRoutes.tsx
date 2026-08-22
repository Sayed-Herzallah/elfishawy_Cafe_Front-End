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

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/menu" element={<PublicMenuPage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/developers" element={<AboutDevelopersPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* POS & Cashier Portal (Accessible by both Cashiers and Admins) */}
        <Route path="/pos" element={<CashierLayout />}>
          <Route index element={<CashierPOSPage />} />
          <Route path="orders" element={<CashierOrdersTrackerPage />} />
          <Route path="inventory" element={<CashierInventoryPage />} />
          <Route path="expenses" element={<CashierExpensesPage />} />
        </Route>

        {/* Admin Portal (Admin & Cashier) */}
        <Route element={<RoleGuard allowedRoles={['admin', 'cashier']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="inventory" element={<AdminInventoryPage />} />
            <Route path="sales" element={<AdminSalesPage />} />
            <Route path="expenses" element={<AdminExpensesPage />} />
            <Route path="reports" element={<AdminReportsPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};