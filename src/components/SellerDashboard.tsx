import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Mail, BarChart3, DollarSign, Globe, Eye, EyeOff, Shield, CheckCircle, AlertCircle, Clock, FileText, Dna as Dns, Upload, TrendingUp, Users, CreditCard } from 'lucide-react'
import { supabase, type Domain, type Inquiry, type DomainVerification, initiateDomainVerification, verifyDomainOwnership, createDNSVerificationRecord } from '../lib/supabase'

interface SellerDashboardProps {
  sellerId: string
  onLogout: () => void
}

interface DomainSale {
  id: string
  domain: { name: string }
  buyer_id: string
  sale_price: number
  marketplace_fee: number
  seller_amount: number
  status: string
  completed_at: string
  created_at: string
}

export default function SellerDashboard({ sellerId, onLogout }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'domains' | 'inquiries' | 'verification' | 'sales' | 'analytics'>('domains')
  const [domains, setDomains] = useState<Domain[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [verifications, setVerifications] = useState<DomainVerification[]>([])
  const [sales, setSales] = useState<DomainSale[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [selectedDomainForVerification, setSelectedDomainForVerification] = useState<string>('')
  const [sellerStatus, setSellerStatus] = useState<string>('')

  useEffect(() => {
    fetchSellerStatus()
    fetchDomains()
    fetchInquiries()
    fetchVerifications()
    fetchSales()
  }, [sellerId])

  const fetchSellerStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('stripe_account_status')
        .eq('id', sellerId)
        .single()

      if (error) throw error
      setSellerStatus(data.stripe_account_status)
    } catch (error) {
      console.error('Error fetching seller status:', error)
    }
  }

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDomains(data || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          domain:domains(name, price)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInquiries(data || [])
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    }
  }

  const fetchVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('domain_verifications')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setVerifications(data || [])
    } catch (error) {
      console.error('Error fetching verifications:', error)
    }
  }

  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('domain_sales')
        .select(`
          *,
          domain:domains(name)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSales(data || [])
    } catch (error) {
      console.error('Error fetching sales:', error)
    }
  }

  const deleteDomain = async (id: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return

    try {
      const { error } = await supabase.from('domains').delete().eq('id', id)
      if (error) throw error
      fetchDomains()
    } catch (error) {
      console.error('Error deleting domain:', error)
    }
  }

  const updateInquiryStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('inquiries')
        .update({ status })
        .eq('id', id)

      if (error) throw error
      fetchInquiries()
    } catch (error) {
      console.error('Error updating inquiry status:', error)
    }
  }

  const handleVerifyDomain = async (verificationId: string) => {
    try {
      const result = await verifyDomainOwnership(verificationId)
      if (result.isVerified) {
        alert('Domain verified successfully! Your domain will now appear in the marketplace.')
        fetchVerifications()
        fetchDomains()
      } else {
        alert(`Verification failed: ${result.failureReason}`)
      }
    } catch (error) {
      console.error('Error verifying domain:', error)
      alert('Error verifying domain')
    }
  }

  const stats = {
    totalDomains: domains.length,
    verifiedDomains: domains.filter(d => d.verification_status === 'verified').length,
    totalValue: domains.filter(d => d.verification_status === 'verified').reduce((sum, domain) => sum + domain.price, 0),
    totalSales: sales.filter(s => s.status === 'completed').length,
    totalEarnings: sales.filter(s => s.status === 'completed').reduce((sum, sale) => sum + sale.seller_amount, 0),
    newInquiries: inquiries.filter(i => i.status === 'new').length
  }

  // Show approval status if not approved
  if (sellerStatus === 'not_connected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Approval</h2>
          <p className="text-gray-600 mb-6">
            Your seller application is pending admin approval. You'll be notified once your account is approved and you can start listing domains.
          </p>
          <button
            onClick={onLogout}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  if (sellerStatus === 'rejected') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Rejected</h2>
          <p className="text-gray-600 mb-6">
            Your seller application has been rejected. Please contact support for more information.
          </p>
          <button
            onClick={onLogout}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                sellerStatus === 'connected' ? 'bg-green-100 text-green-800' :
                sellerStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {sellerStatus === 'connected' ? 'Approved' : 
                 sellerStatus === 'pending' ? 'Approved - Setup Required' : 
                 'Pending'}
              </span>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Domains</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDomains}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-gray-900">{stats.verifiedDomains}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">New Inquiries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newInquiries}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Important Notice for Verified Domains */}
        {stats.verifiedDomains > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-green-800 font-medium">
                Great! You have {stats.verifiedDomains} verified domain{stats.verifiedDomains !== 1 ? 's' : ''} live in the marketplace.
              </p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'domains', label: 'My Domains', icon: Globe },
                { id: 'verification', label: 'Verification', icon: Shield },
                { id: 'sales', label: 'Sales', icon: TrendingUp },
                { id: 'inquiries', label: 'Inquiries', icon: Mail },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'domains' && (
              <DomainsTab
                domains={domains}
                loading={loading}
                onRefresh={fetchDomains}
                onDelete={deleteDomain}
                showAddForm={showAddForm}
                setShowAddForm={setShowAddForm}
                editingDomain={editingDomain}
                setEditingDomain={setEditingDomain}
                sellerId={sellerId}
                onVerifyDomain={(domainName) => {
                  setSelectedDomainForVerification(domainName)
                  setShowVerificationModal(true)
                }}
              />
            )}

            {activeTab === 'verification' && (
              <VerificationTab
                verifications={verifications}
                onVerify={handleVerifyDomain}
                onRefresh={fetchVerifications}
              />
            )}

            {activeTab === 'sales' && (
              <SalesTab sales={sales} />
            )}

            {activeTab === 'inquiries' && (
              <InquiriesTab
                inquiries={inquiries}
                onUpdateStatus={updateInquiryStatus}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab domains={domains} inquiries={inquiries} sales={sales} />
            )}
          </div>
        </div>
      </div>

      {(showAddForm || editingDomain) && (
        <DomainFormModal
          domain={editingDomain}
          sellerId={sellerId}
          onClose={() => {
            setShowAddForm(false)
            setEditingDomain(null)
          }}
          onSave={() => {
            fetchDomains()
            setShowAddForm(false)
            setEditingDomain(null)
          }}
        />
      )}

      {showVerificationModal && (
        <VerificationModal
          domainName={selectedDomainForVerification}
          sellerId={sellerId}
          onClose={() => {
            setShowVerificationModal(false)
            setSelectedDomainForVerification('')
          }}
          onSuccess={() => {
            fetchVerifications()
            fetchDomains()
            setShowVerificationModal(false)
            setSelectedDomainForVerification('')
          }}
        />
      )}
    </div>
  )
}

function DomainsTab({ domains, loading, onRefresh, onDelete, showAddForm, setShowAddForm, editingDomain, setEditingDomain, sellerId, onVerifyDomain }: any) {
  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>
  }

  const getVerificationStatusBadge = (status: string) => {
    const badges = {
      unverified: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      verified: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      expired: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.unverified
    const Icon = badge.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const getSaleStatusBadge = (status: string) => {
    const badges = {
      available: { color: 'bg-green-100 text-green-800' },
      pending: { color: 'bg-yellow-100 text-yellow-800' },
      sold: { color: 'bg-blue-100 text-blue-800' },
      withdrawn: { color: 'bg-gray-100 text-gray-800' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.available
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">My Domain Portfolio</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </button>
      </div>

      {domains.length === 0 ? (
        <div className="text-center py-12">
          <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No domains yet</h3>
          <p className="text-gray-600 mb-6">Start building your domain portfolio by adding your first domain.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Your First Domain
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visibility</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {domains.map((domain: Domain) => (
                <tr key={domain.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{domain.name}</div>
                        {domain.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">{domain.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${domain.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {domain.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getVerificationStatusBadge(domain.verification_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getSaleStatusBadge(domain.sale_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {domain.is_visible ? (
                        <Eye className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400 mr-1" />
                      )}
                      <span className={`text-sm ${domain.is_visible ? 'text-green-600' : 'text-gray-500'}`}>
                        {domain.is_visible ? 'Live in Marketplace' : 'Hidden'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {domain.verification_status === 'unverified' && (
                        <button
                          onClick={() => onVerifyDomain(domain.name)}
                          className="text-purple-600 hover:text-purple-900 transition-colors"
                          title="Verify ownership"
                        >
                          <Shield className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setEditingDomain(domain)}
                        className="text-purple-600 hover:text-purple-900 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(domain.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SalesTab({ sales }: { sales: DomainSale[] }) {
  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800' },
      completed: { color: 'bg-green-100 text-green-800' },
      failed: { color: 'bg-red-100 text-red-800' },
      refunded: { color: 'bg-gray-100 text-gray-800' }
    }
    
    const badge = badges[status as keyof typeof badges] || badges.pending
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Domain Sales</h2>
      
      {sales.length === 0 ? (
        <div className="text-center py-12">
          <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales yet</h3>
          <p className="text-gray-600">Your domain sales will appear here once you make your first sale.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marketplace Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Your Earnings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{sale.domain.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${sale.sale_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    -${sale.marketplace_fee.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ${sale.seller_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(sale.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sale.completed_at || sale.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function VerificationTab({ verifications, onVerify, onRefresh }: any) {
  const getVerificationTypeIcon = (type: string) => {
    switch (type) {
      case 'dns_txt': return Dns
      case 'registrar_api': return Globe
      case 'document_upload': return FileText
      default: return Shield
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Domain Verification Status</h2>
        <button
          onClick={onRefresh}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-4">
        {verifications.map((verification: DomainVerification) => {
          const Icon = getVerificationTypeIcon(verification.verification_type)
          
          return (
            <div key={verification.id} className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 flex items-center">
                    <Icon className="h-5 w-5 mr-2" />
                    {verification.domain_name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {verification.verification_type.replace('_', ' ')} verification
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {verification.status === 'pending' && (
                    <button
                      onClick={() => onVerify(verification.id)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Check Now
                    </button>
                  )}
                  <span className="text-xs text-gray-500">
                    {new Date(verification.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              {verification.verification_type === 'dns_txt' && verification.verification_token && (
                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Add this TXT record to your domain's DNS:
                  </p>
                  <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                    <div><strong>Name:</strong> _domain-verification</div>
                    <div><strong>Value:</strong> {createDNSVerificationRecord(verification.domain_name, verification.verification_token)}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {verification.status === 'verified' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                  {verification.status === 'failed' && <AlertCircle className="h-5 w-5 text-red-500 mr-2" />}
                  {verification.status === 'pending' && <Clock className="h-5 w-5 text-yellow-500 mr-2" />}
                  <span className={`text-sm font-medium ${
                    verification.status === 'verified' ? 'text-green-600' :
                    verification.status === 'failed' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {verification.status.charAt(0).toUpperCase() + verification.status.slice(1)}
                  </span>
                </div>
                {verification.failure_reason && (
                  <span className="text-sm text-red-600">{verification.failure_reason}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InquiriesTab({ inquiries, onUpdateStatus }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Domain Inquiries</h2>
      
      {inquiries.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No inquiries yet</h3>
          <p className="text-gray-600">Customer inquiries about your domains will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry: Inquiry) => (
            <div key={inquiry.id} className="bg-gray-50 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{inquiry.buyer_name}</h3>
                  <p className="text-sm text-gray-600">{inquiry.buyer_email}</p>
                  <p className="text-sm text-purple-600 font-medium">
                    {inquiry.domain?.name} - ${inquiry.domain?.price?.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={inquiry.status}
                    onChange={(e) => onUpdateStatus(inquiry.id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="new">New</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                  <span className="text-xs text-gray-500">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{inquiry.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AnalyticsTab({ domains, inquiries, sales }: any) {
  const verificationStats = domains.reduce((acc: any, domain: Domain) => {
    acc[domain.verification_status] = (acc[domain.verification_status] || 0) + 1
    return acc
  }, {})

  const categoryStats = domains.filter((d: Domain) => d.verification_status === 'verified').reduce((acc: any, domain: Domain) => {
    acc[domain.category] = (acc[domain.category] || 0) + 1
    return acc
  }, {})

  const inquiryStats = inquiries.reduce((acc: any, inquiry: Inquiry) => {
    acc[inquiry.status] = (acc[inquiry.status] || 0) + 1
    return acc
  }, {})

  const salesStats = sales.reduce((acc: any, sale: DomainSale) => {
    acc[sale.status] = (acc[sale.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">Portfolio Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Status</h3>
          <div className="space-y-3">
            {Object.entries(verificationStats).map(([status, count]: [string, any]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">{status}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Verified Domains by Category</h3>
          <div className="space-y-3">
            {Object.entries(categoryStats).map(([category, count]: [string, any]) => (
              <div key={category} className="flex justify-between items-center">
                <span className="text-gray-700">{category}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inquiry Status</h3>
          <div className="space-y-3">
            {Object.entries(inquiryStats).map(([status, count]: [string, any]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">{status}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Status</h3>
          <div className="space-y-3">
            {Object.entries(salesStats).map(([status, count]: [string, any]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">{status}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DomainFormModal({ domain, sellerId, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: domain?.name || '',
    price: domain?.price || '',
    category: domain?.category || '',
    description: domain?.description || '',
    tags: domain?.tags?.join(', ') || '',
    featured: domain?.featured || false,
    is_for_sale: domain?.is_for_sale !== undefined ? domain.is_for_sale : true
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const domainData = {
        name: formData.name,
        seller_id: sellerId,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description || null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        featured: formData.featured,
        is_for_sale: formData.is_for_sale,
        verification_status: 'unverified',
        sale_status: 'available',
        is_visible: false // Will become true after verification
      }

      console.log('Submitting domainData:', domainData);
      console.log('Current sellerId:', sellerId);

      let error
      if (domain) {
        ({ error } = await supabase
          .from('domains')
          .update(domainData)
          .eq('id', domain.id))
      } else {
        ({ error } = await supabase
          .from('domains')
          .insert([domainData]))
      }

      if (error) throw error

      onSave()
      alert(domain ? 'Domain updated successfully!' : 'Domain added successfully! Please verify ownership to make it visible in the marketplace.')
    } catch (error) {
      console.error('Error saving domain:', error)
      alert('Error saving domain. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">
            {domain ? 'Edit Domain' : 'Add New Domain'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="h-6 w-6 rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Domain Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="example.com"
            />
            <p className="text-xs text-gray-500 mt-1">
              You'll need to verify ownership before this domain becomes visible in the marketplace
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
            <input
              type="number"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select Category</option>
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="E-commerce">E-commerce</option>
              <option value="Finance">Finance</option>
              <option value="Health">Health</option>
              <option value="Education">Education</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              placeholder="Describe the domain's potential and value..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="premium, startup, brandable"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="featured"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="featured" className="ml-2 text-sm text-gray-700">
              Mark as featured domain
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_for_sale"
              checked={formData.is_for_sale}
              onChange={(e) => setFormData({ ...formData, is_for_sale: e.target.checked })}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="is_for_sale" className="ml-2 text-sm text-gray-700">
              Available for sale
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            {isSubmitting ? 'Saving...' : (domain ? 'Update Domain' : 'Add Domain')}
          </button>
        </form>
      </div>
    </div>
  )
}

function VerificationModal({ domainName, sellerId, onClose, onSuccess }: any) {
  const [verificationType, setVerificationType] = useState<'dns_txt' | 'registrar_api' | 'document_upload'>('dns_txt')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')

  const handleStartVerification = async () => {
    setIsSubmitting(true)
    try {
      const result = await initiateDomainVerification(sellerId, domainName, verificationType)
      setVerificationToken(result.token.token)
      
      if (verificationType !== 'dns_txt') {
        // For non-DNS verification, we can immediately attempt verification
        setTimeout(async () => {
          try {
            await verifyDomainOwnership(result.verification.id)
            onSuccess()
          } catch (error) {
            console.error('Verification failed:', error)
          }
        }, 2000)
      }
    } catch (error) {
      console.error('Error starting verification:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900">Verify Domain Ownership</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Plus className="h-6 w-6 rotate-45" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Domain: {domainName}</h4>
            <p className="text-sm text-gray-600">
              Choose a verification method to prove you own this domain:
            </p>
          </div>

          <div className="space-y-4">
            <label className="flex items-start p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="verification"
                value="dns_txt"
                checked={verificationType === 'dns_txt'}
                onChange={(e) => setVerificationType(e.target.value as any)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="flex items-center">
                  <Dns className="h-5 w-5 mr-2 text-purple-600" />
                  <span className="font-medium">DNS TXT Record</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Add a TXT record to your domain's DNS settings (recommended)
                </p>
              </div>
            </label>

            <label className="flex items-start p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="verification"
                value="registrar_api"
                checked={verificationType === 'registrar_api'}
                onChange={(e) => setVerificationType(e.target.value as any)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-green-600" />
                  <span className="font-medium">Registrar API</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Connect through your domain registrar's API
                </p>
              </div>
            </label>

            <label className="flex items-start p-4 border rounded-xl cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="verification"
                value="document_upload"
                checked={verificationType === 'document_upload'}
                onChange={(e) => setVerificationType(e.target.value as any)}
                className="mt-1 mr-3"
              />
              <div>
                <div className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-purple-600" />
                  <span className="font-medium">Document Upload</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Upload ownership documentation from your registrar
                </p>
              </div>
            </label>
          </div>

          {verificationToken && verificationType === 'dns_txt' && (
            <div className="bg-purple-50 rounded-xl p-4">
              <h5 className="font-medium text-purple-900 mb-2">DNS Instructions:</h5>
              <div className="bg-white rounded p-3 font-mono text-sm">
                <div><strong>Record Type:</strong> TXT</div>
                <div><strong>Name:</strong> _domain-verification</div>
                <div><strong>Value:</strong> {createDNSVerificationRecord(domainName, verificationToken)}</div>
              </div>
              <p className="text-sm text-purple-700 mt-2">
                Add this record to your DNS settings, then click "Verify" to check.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleStartVerification}
              disabled={isSubmitting}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-xl transition-colors"
            >
              {isSubmitting ? 'Starting...' : 'Start Verification'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}