import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';

// Import components
import Home from './components/Home';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import SellerDashboard from './components/SellerDashboard';
import ListDomainForm from './components/ListDomainForm';
import ContactForm from './components/ContactForm';
import UserSubscription from './components/UserSubscription';
import SuccessPage from './components/SuccessPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase?.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    }) || { data: { subscription: null } };

    return () => subscription?.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home session={session} />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/success" element={<SuccessPage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Seller Routes */}
          <Route path="/list-domain" element={<ListDomainForm />} />
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/subscription" 
            element={
              <ProtectedRoute>
                <UserSubscription />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to home */}
          <Route path="*" element={<Home session={session} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;