import React, { useState } from 'react'
import { Lock, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AdminLoginProps {
  onLogin: () => void
}

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!supabase) {
      setError('Authentication service is not available. Please check your configuration.')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (signInError) throw signInError

      // If sign-in is successful, call onLogin.
      // The role check will happen in App.tsx's handleAdminLoginSuccess.
      if (data.user) {
        onLogin()
      } else {
        // This case should ideally not be reached if signInError is handled
        setError('Login failed: No user data returned.')
      }
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-white/20 rounded-full p-3 inline-block mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Admin Access</h2>
            <p className="text-purple-100">Restricted access for administrators only</p>
          </div>

          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-100 text-sm">
            <h3 className="font-semibold mb-2">⚠️ SECURITY NOTICE:</h3>
            <p className="text-xs">
              This admin panel is restricted to authorized personnel only.
              Unauthorized access attempts are logged and monitored.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-purple-100 mb-2">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={credentials.email}
                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 transition-all"
                placeholder="admin@domainvault.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-100 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 transition-all pr-12"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-200 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-100 text-sm flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !supabase}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Admin Sign In
                </>
              )}
            </button>
          </form>

          {!supabase && (
            <div className="mt-6 bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 text-yellow-100 text-sm">
              <AlertCircle className="h-5 w-5 mr-2 inline" />
              Demo mode: Admin features require Supabase configuration.
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-purple-200 text-sm">
              Secure admin access with restricted privileges
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}