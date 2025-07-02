import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Mail, AlertCircle, Github } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import AuthLayout from './AuthLayout'

export default function Login() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supabase) {
      setError('Authentication service is not available. Please check your configuration.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) throw error
      
      if (data.user) {
        navigate('/')
      }
    } catch (error: any) {
      setError(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGitHubLogin = async () => {
    if (!supabase) {
      setError('GitHub OAuth requires Supabase configuration. Please set up your environment variables.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      })

      if (error) throw error
    } catch (error: any) {
      setError(error.message || 'GitHub login failed')
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Sign In" subtitle="Welcome back to your Domain Vault!">
      <div className="space-y-6">
        {/* GitHub OAuth Button - Always show but handle demo mode */}
        <button
          onClick={handleGitHubLogin}
          disabled={isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
          ) : (
            <>
              <Github className="h-5 w-5 mr-2" />
              Continue with GitHub
            </>
          )}
        </button>

        {/* Divider - Always show */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/20"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-blue-100">
              Or continue with email
            </span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 h-5 w-5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 transition-all"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-200 h-5 w-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 transition-all"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-200 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm">
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
                Sign In
              </>
            )}
          </button>
        </form>

        {!supabase && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 text-yellow-100 text-sm">
            <AlertCircle className="h-5 w-5 mr-2 inline" />
            Demo mode: Authentication features require Supabase configuration. Set up your environment variables to enable GitHub OAuth and email authentication.
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-blue-200 text-sm">
            Don't have an account?{' '}
            <Link to="/signup" className="text-white hover:text-purple-200 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
