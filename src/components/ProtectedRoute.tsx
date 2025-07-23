import { ReactNode, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  session: Session | null;
  requiredRole?: 'user' | 'seller' | 'admin';
}

interface Profile {
  id: string;
  role: string;
}

export default function ProtectedRoute({ 
  children, 
  session, 
  requiredRole = 'user' 
}: ProtectedRouteProps) {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!session || !supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user'); // Default role
        } else {
          setUserRole(data?.role || 'user');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('user'); // Default role
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check role permissions
  const hasPermission = () => {
    if (!userRole) return false;
    
    switch (requiredRole) {
      case 'admin':
        return userRole === 'admin';
      case 'seller':
        return userRole === 'seller' || userRole === 'admin';
      case 'user':
      default:
        return true; // All authenticated users can access user routes
    }
  };

  // Show unauthorized message if user doesn't have required role
  if (!hasPermission()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. 
            {requiredRole === 'admin' && ' Admin access required.'}
            {requiredRole === 'seller' && ' Seller account required.'}
          </p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}