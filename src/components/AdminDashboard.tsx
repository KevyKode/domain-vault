import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Mail, BarChart3, DollarSign, Globe, Eye, EyeOff, Users, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase, type Domain, type Inquiry } from '../lib/supabase'

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'domains' | 'inquiries' | 'analytics' | 'sellers'>('domains')
  const [domains, setDomains] = useState<Domain[]>([])
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [sellers, setSellers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null)

  useEffect(() => {
    fetchDomains()
    fetchInquiries()
    fetchSellers()
  }, [])

  const fetchDomains = async () => {
    try {
      const { data, error } = await supabase
        .from('domains')
        .select('*')
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
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInquiries(data || [])
    } catch (error) {
      console.error('Error fetching inquiries:', error)
    }
  }

  const fetchSellers = async () => {
    try {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSellers(data || [])
    } catch (error) {
      console.error('Error fetching sellers:', error)
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

  const pendingSellers = sellers.filter(s => s.stripe_account_status === 'not_connected')

  const stats = {
    totalDomains: domains.length,
    totalValue: domains.reduce((sum, domain) => sum + domain.price, 0),
    newInquiries: inquiries.filter(i => i.status === 'new').length,
    featuredDomains: domains.filter(d => d.featured).length,
    totalSellers: sellers.length,
    pendingSellers: pendingSellers.length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              {pendingSellers.length > 0 && (
                <Link
                  to="/admin/approval"
                  className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
                >
                  {pendingSellers.length} Pending Approval{pendingSellers.length !== 1 ? 's' : ''}
                </Link>
              )}
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
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">${stats.totalValue.toLocaleString()}</p>
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
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Featured</p>
                <p className="text-2xl font-bold text-gray-900">{stats.featuredDomains}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sellers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSellers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingSellers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'domains', label: 'Domain Management', icon: Globe },
                { id: 'sellers', label: 'Seller Management', icon: Users },
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
              />
            )}

            {activeTab === 'sellers' && (
              <SellersTab sellers={sellers} onRefresh={fetchSellers} />
            )}

            {activeTab === 'inquiries' && (
              <InquiriesTab
                inquiries={inquiries}
                onUpdateStatus={updateInquiryStatus}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab domains={domains} inquiries={inquiries} sellers={sellers} />
            )}
          </div>
        </div>
      </div>

      {(showAddForm || editingDomain) && (
        <DomainFormModal
          domain={editingDomain}
          onClose={() => {
            setShowAddForm(false)
            setEditingDomain(null)
          }}
          onSave={fetchDomains}
        />
      )}
    </div>
  )
}

function DomainsTab({ domains, loading, onRefresh, onDelete, showAddForm, setShowAddForm, editingDomain, setEditingDomain }: any) {
  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded"></div>
      ))}
    </div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Domain Portfolio</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Domain
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                  <div className="flex items-center">
                    {domain.featured ? (
                      <Eye className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400 mr-1" />
                    )}
                    <span className={`text-sm ${domain.featured ? 'text-green-600' : 'text-gray-500'}`}>
                      {domain.featured ? 'Featured' : 'Regular'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
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
    </div>
  )
}

function SellersTab({ sellers, onRefresh }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Seller Management</h2>
        <div className="flex space-x-2">
          <Link
            to="/admin/approval"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Pending Approvals
          </Link>
          <button
            onClick={onRefresh}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sellers.map((seller: any) => (
              <tr key={seller.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{seller.full_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{seller.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{seller.company_name || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    seller.stripe_account_status === 'connected' ? 'bg-green-100 text-green-800' :
                    seller.stripe_account_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    seller.stripe_account_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {seller.stripe_account_status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(seller.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function InquiriesTab({ inquiries, onUpdateStatus }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Inquiries</h2>
      
      <div className="space-y-4">
        {inquiries.map((inquiry: Inquiry) => (
          <div key={inquiry.id} className="bg-gray-50 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{inquiry.buyer_name}</h3>
                <p className="text-sm text-gray-600">{inquiry.buyer_email}</p>
                <p className="text-sm text-purple-600 font-medium">Domain inquiry</p>
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
    </div>
  )
}

function AnalyticsTab({ domains, inquiries, sellers }: any) {
  const categoryStats = domains.reduce((acc: any, domain: Domain) => {
    acc[domain.category] = (acc[domain.category] || 0) + 1
    return acc
  }, {})

  const inquiryStats = inquiries.reduce((acc: any, inquiry: Inquiry) => {
    acc[inquiry.status] = (acc[inquiry.status] || 0) + 1
    return acc
  }, {})

  const sellerStats = sellers.reduce((acc: any, seller: any) => {
    acc[seller.stripe_account_status] = (acc[seller.stripe_account_status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-gray-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Domains by Category</h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Status</h3>
          <div className="space-y-3">
            {Object.entries(sellerStats).map(([status, count]: [string, any]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                <span className="font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DomainFormModal({ domain, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    name: domain?.name || '',
    price: domain?.price || '',
    category: domain?.category || '',
    description: domain?.description || '',
    tags: domain?.tags?.join(', ') || '',
    featured: domain?.featured || false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const domainData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description || null,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        featured: formData.featured
      }

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
      onClose()
    } catch (error) {
      console.error('Error saving domain:', error)
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