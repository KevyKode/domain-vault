// src/components/auth/SellerAuth.tsx

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';

const SellerAuth = () => {
  return (
    <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        providers={['google', 'github']} // Optional: add social logins
        redirectTo={`${window.location.origin}/`} // Redirects back to home after login
      />
    </div>
  );
};

export default SellerAuth;