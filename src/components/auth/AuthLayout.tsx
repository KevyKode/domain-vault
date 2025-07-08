// src/components/auth/AuthLayout.tsx

import { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthLayout = () => {
  const [isLoginView, setIsLoginView] = useState(true);

  return (
    <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
      <div className="mb-6">
        {isLoginView ? <Login /> : <Signup />}
      </div>

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