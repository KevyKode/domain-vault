// src/components/auth/AuthLayout.tsx

import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { supabase } from '../../supabaseClient';

// Reusable SVG Icons for the buttons (no change here)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.94C34.353 4.932 29.412 2.5 24 2.5C13.254 2.5 4.5 11.254 4.5 22.5S13.254 42.5 24 42.5c10.112 0 18.252-7.854 18.252-18.252c0-1.636-.143-3.237-.411-4.748z" />
  </svg>
);
const GithubIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.165 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.651.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.852 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

// ===== FIX #1: Define a specific type for the providers we actually use. =====
type OAuthProvider = 'google' | 'github';

const AuthLayout = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  // ===== FIX #2: Use our new, specific type for the loading state. =====
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ===== FIX #3: The function now only accepts providers of our specific type. =====
  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setLoading(provider);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setLoading(null);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
      <h2 className="text-2xl font-bold text-center text-white mb-2">
        {isLoginView ? 'Welcome Back' : 'Create Your Account'}
      </h2>
      <p className="text-center text-gray-400 mb-8">
        {isLoginView ? 'Sign in to manage your domains.' : 'Join the #1 domain marketplace.'}
      </p>

      <div className="space-y-4">
        <button onClick={() => handleOAuthSignIn('google')} disabled={!!loading} className="w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-gray-200 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200 disabled:opacity-50">
          <GoogleIcon />
          {loading === 'google' ? 'Redirecting...' : 'Continue with Google'}
        </button>
        <button onClick={() => handleOAuthSignIn('github')} disabled={!!loading} className="w-full inline-flex items-center justify-center py-2.5 px-4 text-sm font-semibold text-white bg-[#24292F] hover:bg-[#30363d] rounded-md transition-colors duration-200 disabled:opacity-50">
          <GithubIcon />
          {loading === 'github' ? 'Redirecting...' : 'Continue with GitHub'}
        </button>
      </div>

      <div className="my-6 flex items-center">
        <div className="flex-grow border-t border-gray-600"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
        <div className="flex-grow border-t border-gray-600"></div>
      </div>
      
      <div className="mb-6">
        {isLoginView ? <Login /> : <Signup />}
      </div>

      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center text-sm mt-4">{error}</p>}

      <div className="text-center">
        <button
          onClick={() => setIsLoginView(!isLoginView)}
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {isLoginView
            ? "Don't have an account? Sign Up"
            : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
};

export default AuthLayout;