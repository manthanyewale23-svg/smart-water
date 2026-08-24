import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface Props {
  role?: 'admin' | 'worker' | 'citizen';
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<Props> = ({ role, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <LoadingSpinner size="lg" text="Loading SmartWater..." />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} replace />;

  return <>{children}</>;
};
