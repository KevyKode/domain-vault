import React from 'react'
import DomainVaultLogo from '../DomainVaultLogo'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="bg-white/20 rounded-full p-3 inline-block mb-4">
              <DomainVaultLogo size="md" variant="icon-only" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
            <p className="text-blue-100">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}