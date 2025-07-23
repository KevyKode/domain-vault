import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, User, Mail, Building, Phone, Globe, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface PendingSeller {
  id: string
  email: string
  full_name: string
  company_name?: string
  phone?: string
  created_at: string
  email_verified: boolean
  stripe_account_status: string
}

interface AdminApprovalProps {
  onLogout: () => void
}

export default function AdminApproval({ onLogout }: AdminApprovalProps) {
  const [pendingSellers, setPendingSellers] = useState<PendingSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingSellers()
  }, [])

  const fetchPendingSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('stripe_account_status', 'not_connected')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPendingSellers(data || [])
    } catch (error) {
      console.error('Error fetching pending sellers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (sellerId: string, approved: boolean) => {
    setProcessingId(sellerId)
    
    try {
      const newStatus = approved ? 'pending' : 'rejected'
      
      const { error } = await supabase
        .from('sellers')
        .update({ 
          stripe_account_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', sellerId)

      if (error) throw error

      // Remove from pending list
      setPendingSellers(prev => prev.filter(seller => seller.id !== sellerId))
      
      alert(`Seller ${approved ? 'approved' : 'rejected'} successfully!`)
    } catch (error) {
      console.error('Error updating seller status:', error)
      alert('Error processing request. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin - Seller Approval</h1>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Pending Seller Applications ({pendingSellers.length})
            </h2>
            <button
              onClick={fetchPendingSellers}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>

          {pendingSellers.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Applications</h3>
              <p className="text-gray-600">All seller applications have been processed.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingSellers.map((seller) => (
                <div key={seller.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <User className="h-5 w-5 text-gray-500 mr-2" />
                        <h3 className="text-lg font-semibold text-gray-900">{seller.full_name}</h3>
                        {seller.email_verified && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-2" title="Email Verified" />
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          {seller.email}
                        </div>
                        
                        {seller.company_name && (
                          <div className="flex items-center">
                            <Building className="h-4 w-4 mr-2" />
                            {seller.company_name}
                          </div>
                        )}
                        
                        {seller.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {seller.phone}
                          </div>
                        )}
                        
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Applied: {new Date(seller.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 ml-6">
                      <button
                        onClick={() => handleApproval(seller.id, true)}
                        disabled={processingId === seller.id}
                        className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      >
                        {processingId === seller.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleApproval(seller.id, false)}
                        disabled={processingId === seller.id}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                      >
                        {processingId === seller.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}