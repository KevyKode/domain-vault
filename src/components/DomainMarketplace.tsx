import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, Domain } from '../lib/supabase';
import { Link } from 'react-router-dom';
import StripeEscrowPayment from './StripeEscrowPayment';

interface DomainMarketplaceProps {
  session: Session | null;
}

export default function DomainMarketplace({ session }: DomainMarketplaceProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Sample domains for demo (in production, these would come from the database)
  const sampleDomains: Domain[] = [
    {
      id: '1',
      name: 'techstartup.com',
      seller_id: 'seller1',
      price: 15000,
      category: 'Technology',
      description: 'Perfect domain for technology startups and innovative companies',
      tags: ['tech', 'startup', 'innovation'],
      featured: true,
      verification_status: 'verified',
      is_visible: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_for_sale: true,
      sale_status: 'available'
    },
    {
      id: '2',
      name: 'ecommercepro.com',
      seller_id: 'seller1',
      price: 25000,
      category: 'E-commerce',
      description: 'Premium domain for e-commerce businesses and online stores',
      tags: ['ecommerce', 'business', 'premium'],
      featured: true,
      verification_status: 'verified',
      is_visible: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_for_sale: true,
      sale_status: 'available'
    },
    {
      id: '3',
      name: 'healthplus.com',
      seller_id: 'seller2',
      price: 18000,
      category: 'Health',
      description: 'Ideal for healthcare providers and wellness companies',
      tags: ['health', 'wellness', 'medical'],
      featured: false,
      verification_status: 'verified',
      is_visible: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_for_sale: true,
      sale_status: 'available'
    },
    {
      id: '4',
      name: 'financeexpert.com',
      seller_id: 'seller2',
      price: 22000,
      category: 'Finance',
      description: 'Professional domain for financial services and consulting',
      tags: ['finance', 'consulting', 'professional'],
      featured: false,
      verification_status: 'verified',
      is_visible: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_for_sale: true,
      sale_status: 'available'
    },
    {
      id: '5',
      name: 'educationhub.com',
      seller_id: 'seller3',
      price: 12000,
      category: 'Education',
      description: 'Perfect for educational institutions and online learning platforms',
      tags: ['education', 'learning', 'online'],
      featured: false,
      verification_status: 'verified',
      is_visible: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_for_sale: true,
      sale_status: 'available'
    },
    {
      id: '6',
      name: 'traveladventure.com',
      seller_id: 'seller3',
      price: 16000,
      category: 'Travel',
      description: 'Ideal for travel agencies and adventure tourism companies',
      tags: ['travel', 'adventure', 'tourism'],
      featured: true,
      verification_status: 'verified',
      is_visible: true,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
      is_for_sale: true,
      sale_status: 'available'
    }
  ];

  useEffect(() => {
    // In production, this would fetch from Supabase
    // For demo, we'll use sample data
    setDomains(sampleDomains);
    setFilteredDomains(sampleDomains);
    setLoading(false);
  }, []);

  useEffect(() => {
    filterDomains();
  }, [domains, searchTerm, selectedCategory, priceRange]);

  const filterDomains = () => {
    let filtered = domains;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(domain =>
        domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(domain => domain.category === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(domain => 
      domain.price >= priceRange[0] && domain.price <= priceRange[1]
    );

    setFilteredDomains(filtered);
  };

  const handlePurchase = (domain: Domain) => {
    if (!session) {
      alert('Please sign in to purchase domains');
      return;
    }
    setSelectedDomain(domain);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (paymentIntentId: string) => {
    console.log('Payment successful:', paymentIntentId);
    setShowPaymentModal(false);
    setSelectedDomain(null);
    alert('Payment successful! Escrow transaction created. The seller will be notified to transfer the domain.');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const categories = ['Technology', 'E-commerce', 'Health', 'Finance', 'Education', 'Travel', 'Business'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Domain Marketplace</h1>
          <p className="text-gray-600 mt-2">Discover premium domains with verified ownership and secure escrow protection</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search domains..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            {/* Price Range */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Max Price:</span>
              <input
                type="range"
                min="0"
                max="100000"
                step="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-24"
              />
              <span className="text-sm text-gray-600 min-w-[80px]">${priceRange[1].toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Domain Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredDomains.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-600">Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDomains.map((domain) => (
              <div key={domain.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {domain.featured && (
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold px-3 py-1">
                    FEATURED
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{domain.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{domain.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {domain.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">{domain.category}</span>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-green-600">Verified</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">${domain.price.toLocaleString()}</span>
                      <span className="text-sm text-gray-500 ml-1">USD</span>
                    </div>
                    <button
                      onClick={() => handlePurchase(domain)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedDomain && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Purchase {selectedDomain.name}</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-4">
              <StripeEscrowPayment
                session={session}
                escrowTransactionId={`escrow_${selectedDomain.id}_${Date.now()}`}
                amount={selectedDomain.price}
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={handlePaymentError}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}