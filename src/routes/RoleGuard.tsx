import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles }) => {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfaf7]">
        <LoadingSpinner size="lg" text="جاري التحقق من الصلاحيات..." />
      </div>
    );
  }

  if (!role || !allowedRoles.includes(role)) {
    // If cashier tries to visit admin routes -> redirect to /pos
    if (role === 'cashier') {
      return <Navigate to="/pos" replace />;
    }
    // If admin tries to visit cashier-only routes -> allow or redirect
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
