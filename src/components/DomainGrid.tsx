import React from 'react'
import { ExternalLink, Tag, ShoppingCart, Star, Globe, User } from 'lucide-react'
import type { Domain } from '../lib/supabase'
import { createDomainCheckoutSession } from '../lib/stripe'

interface DomainGridProps {
  domains: Domain[]
  onDomainClick?: (domain: Domain) => void
  viewMode?: 'grid' | 'list'
}

export default function DomainGrid({ domains, onDomainClick, viewMode = 'grid' }: DomainGridProps) {
  const handlePurchase = async (domain: Domain) => {
    try {
      const { url } = await createDomainCheckoutSession({
        domainId: domain.id,
        successUrl: `${window.location.origin}/success`,
        cancelUrl: window.location.href
      })
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating domain checkout session:', error)
      alert('Error processing purchase. Please try again.')
    }
  }

  if (domains.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No domains available</h3>
            <p className="text-gray-600">Check back soon for new domain listings from our verified sellers.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className={viewMode === 'grid' ? 
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : 
        "space-y-6"
      }>
        {domains.map((domain) => (
          <div key={domain.id} className={`group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100 ${
            viewMode === 'list' ? 'flex items-center p-6' : ''
          }`}>
            {domain.featured && (
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2">
                <div className="flex items-center justify-center text-white font-semibold text-sm">
                  <Star className="h-4 w-4 mr-1" />
                  Featured Domain
                </div>
              </div>
            )}
            
            <div className={viewMode === 'list' ? 'flex-1 flex items-center justify-between' : 'p-8'}>
              <div className={viewMode === 'list' ? 'flex-1' : ''}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                    {domain.name}
                  </h3>
                  {viewMode === 'grid' && (
                    <ExternalLink className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors duration-300" />
                  )}
                </div>

                <div className={`flex items-center ${viewMode === 'list' ? 'gap-6' : 'justify-between mb-4'}`}>
                  <span className="text-3xl font-bold text-green-600">
                    ${domain.price.toLocaleString()}
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    {domain.category}
                  </span>
                </div>

                {domain.seller && (
                  <div className="flex items-center mb-4 text-sm text-gray-600">
                    <User className="h-4 w-4 mr-1" />
                    <span>Sold by {domain.seller.company_name || domain.seller.full_name}</span>
                  </div>
                )}

                {domain.description && (
                  <p className={`text-gray-600 leading-relaxed ${viewMode === 'list' ? 'mb-0' : 'mb-6'}`}>
                    {domain.description}
                  </p>
                )}

                {domain.tags && domain.tags.length > 0 && viewMode === 'grid' && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {domain.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className={`flex ${viewMode === 'list' ? 'ml-6 gap-2' : 'space-x-2'}`}>
                <button
                  onClick={() => handlePurchase(domain)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/50 flex items-center justify-center"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </button>
                <button
                  onClick={() => onDomainClick(domain)}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-gray-500/50"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
