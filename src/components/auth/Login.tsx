// src/components/auth/Login.tsx

import { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Correct path from auth/ -> components/ -> src/

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }
      // The onAuthStateChange listener in App.tsx will handle the redirect.
} catch (err) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unknown error occurred.');
  }
} finally {
  setLoading(false);
}
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
        <input
          id="email"
          className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
        <input
          id="password"
          className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </div>
    </form>
  );
};

// Make sure to export it if it's not already
export default Login;