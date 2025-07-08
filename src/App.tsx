// src/App.tsx

import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';

// Import your components
import AuthLayout from './components/auth/AuthLayout'; // <-- THIS IS YOUR CUSTOM AUTH COMPONENT
import ListDomainForm from './components/ListDomainForm';
import SellerDashboard from './components/SellerDashboard';
import DomainVaultLogo from './components/DomainVaultLogo';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        
        <header className="text-center mb-12">
          <DomainVaultLogo />
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mt-4">
            DomainVault Marketplace
          </h1>
          <p className="text-lg text-gray-400 mt-2">The secure way to buy and sell premium domains.</p>
        </header>

        <main>
          {/* If there is no session, show your custom authentication layout */}
          {!session ? (
            <AuthLayout /> // <-- THIS LINE IS NOW CORRECT
          ) : (
          /* If the user is logged in, show the seller portal */
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-bold border-b border-gray-700 pb-2 mb-6">List a New Domain</h2>
                <ListDomainForm />
              </div>
              <div>
                <h2 className="text-3xl font-bold border-b border-gray-700 pb-2 mb-6">Your Seller Dashboard</h2>
                <SellerDashboard />
              </div>

              <div className="text-center mt-8">
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Sign Out
                  </button>
              </div>
            </div>
          )}
        </main>

        <footer className="text-center text-gray-500 mt-16 pb-8">
          <p>&copy; {new Date().getFullYear()} DomainVault. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;