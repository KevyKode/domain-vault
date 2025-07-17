import React, { useState } from 'react'
import { Search, TrendingUp, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import DomainVaultLogo from './DomainVaultLogo'

interface HeroProps {
  searchTerm?: string
  setSearchTerm?: (term: string) => void
  user?: any
  onSellerAuth?: () => void
  onAdminLogin?: () => void
  onLogout?: () => void
  isAdmin?: boolean
}

export default function Hero({
  searchTerm: propSearchTerm,
  setSearchTerm: propSetSearchTerm,
  user = null,
  onSellerAuth,
  onAdminLogin,
  onLogout,
  isAdmin = false
}: HeroProps = {}) {
  const [localSearchTerm, setLocalSearchTerm] = useState('')
  
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : localSearchTerm
  const setSearchTerm = propSetSearchTerm || setLocalSearchTerm

  const scrollToMarketplace = () => {
    const marketplaceSection = document.querySelector('[data-marketplace]')
    if (marketplaceSection) {
      marketplaceSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleSellerAuth = () => {
    if (onSellerAuth) {
      onSellerAuth()
    } else {
      // Default behavior - navigate to list domain page
      window.location.href = '/list-domain'
    }
  }

  const handleAdminLogin = () => {
    if (onAdminLogin) {
      onAdminLogin()
    } else {
      // Default behavior - navigate to admin login
      window.location.href = '/admin/login'
    }
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900">
      <div className="absolute inset-0 bg-black/20"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-full p-6">
              <DomainVaultLogo />
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              DomainVault
            </span>
            <span className="block text-white">Marketplace</span>
          </h1>

          <p className="text-xl sm:text-2xl text-purple-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            The premier destination for buying and selling premium domain names.
            Secure your digital future with verified, high-value domains.
          </p>

          <div className="max-w-2xl mx-auto mb-16">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search premium domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg bg-white/90 backdrop-blur-sm border-0 rounded-2xl shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button
              onClick={scrollToMarketplace}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Browse Domains
            </button>
            <button
              onClick={handleSellerAuth}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              Sell Your Domains
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: TrendingUp, title: "High ROI Potential", desc: "Carefully curated domains with proven commercial value" },
              { icon: Shield, title: "Verified Ownership", desc: "All domains are verified and ready for secure transfer" },
              { icon: () => <DomainVaultLogo />, title: "Secure Transactions", desc: "Protected payments with 1% marketplace fee" }
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300">
                <div className="flex justify-center mb-4">
                  <feature.icon className="h-10 w-10 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-purple-100 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}