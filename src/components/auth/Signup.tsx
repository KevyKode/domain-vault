// src/components/auth/Signup.tsx

import { useState } from 'react';
import { supabase } from '../../supabaseClient'; // Correct path

export const Signup = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      // IMPORTANT: Give the user feedback that they need to check their email.
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setError("This user already exists. Please try logging in.");
      } else {
        setMessage('Success! Please check your email for a confirmation link.');
      }

} catch (err) {
  if (err instanceof Error) {
    setError(err.message);
  } else {
    setError('An unknown error occurred during sign up.');
  }
} finally {
  setLoading(false);
}
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4">
      {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-center">{error}</p>}
      {message && <p className="text-green-400 bg-green-900/50 p-3 rounded-md text-center">{message}</p>}
      <div>
        <label htmlFor="email-signup" className="block text-sm font-medium text-gray-300">Email</label>
        <input id="email-signup" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required 
               className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <label htmlFor="password-signup" className="block text-sm font-medium text-gray-300">Password</label>
        <input id="password-signup" type="password" placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required 
               className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500" />
      </div>
      <div>
        <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </div>
    </form>
  );
};

export default Signup;