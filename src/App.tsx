import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom' // Import useNavigate
import Hero from './components/Hero'
import DomainGrid from './components/DomainGrid'
import FilterBar from './components/FilterBar'
import ContactForm from './components/ContactForm'
import SuccessPage from './components/SuccessPage'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import SellerAuth from './components/SellerAuth'
import SellerDashboard from './components/SellerDashboard'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'
import AdminApproval from './components/AdminApproval'
import { supabase, type Domain } from './lib/supabase'

// Simple domain type for fallback
interface SimpleDomain {
  id: string
  name: string
  price: number
  category: string
  description: string
  tags: string[]
  featured: boolean
  verification_status: string
  is_visible: boolean
  created_at: string
  seller_id: string
  is_for_sale: boolean
  sale_status: string
}

// IMPORTANT: Replace with your actual Supabase Edge Functions URL
// You can find this in your Supabase project settings under Functions -> Settings
const SUPABASE_FUNCTIONS_URL = 'https://bvxceienrftnimcdtbom.supabase.co/functions/v1'; 

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [domains, setDomains] = useState<Domain[]>([])
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showContactForm, setShowContactForm] = useState(false)
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null)
  const [showSellerAuth, setShowSellerAuth] = useState(false)
  const [sellerId, setSellerId] = useState<string | null>(null)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    console.log('App mounted, checking auth...')
    const initializeAuth = checkAuth()
    loadDomains()

    // Cleanup function for auth subscription
    return () => {
      if (typeof initializeAuth === 'function') {
        initializeAuth()
      }
    }
  }, [])

  useEffect(() => {
    filterAndSortDomains()
  }, [domains, searchTerm, selectedCategory, sortBy])

  const checkAuth = async () => {
    try {
      if (!supabase) {
        console.log('Supabase not configured, using demo mode')
        setLoading(false)
        return
      }

      // Handle OAuth callback and get current session
      const { data, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Auth error:', error)
      }

      setUser(data.session?.user || null)

      // Check if user is admin
      if (data.session?.user?.email === 'admin@domainvault.com') {
        setIsAdmin(true)
      }

      // Listen for auth state changes (important for OAuth)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email)
          setUser(session?.user || null)

          if (session?.user?.email === 'admin@domainvault.com') {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }

          // Handle OAuth success
          if (event === 'SIGNED_IN' && session) {
            console.log('User signed in successfully:', session.user.email)
          }

          // Handle sign out
          if (event === 'SIGNED_OUT') {
            console.log('User signed out')
            setIsAdmin(false)
            setSellerId(null)
          }
        }
      )

      // Cleanup subscription on unmount
      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Auth check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDomains = async () => {
    try {
      if (!supabase) {
        // Demo data when Supabase is not configured
        const demoData: SimpleDomain[] = [
          {
            id: '1',
            name: 'techstartup.com',
            price: 15000,
            category: 'Technology',
            description: 'Perfect domain for a technology startup',
            tags: ['tech', 'startup', 'business'],
            featured: true,
            verification_status: 'verified',
            is_visible: true,
            created_at: new Date().toISOString(),
            seller_id: 'demo-seller',
            is_for_sale: true,
            sale_status: 'available'
          },
          {
            id: '2',
            name: 'healthapp.io',
            price: 8500,
            category: 'Health',
            description: 'Great for health and wellness applications',
            tags: ['health', 'app', 'wellness'],
            featured: false,
            verification_status: 'verified',
            is_visible: true,
            created_at: new Date().toISOString(),
            seller_id: 'demo-seller',
            is_for_sale: true,
            sale_status: 'available'
          },
          {
            id: '3',
            name: 'financetools.net',
            price: 12000,
            category: 'Finance',
            description: 'Ideal for financial tools and services',
            tags: ['finance', 'tools', 'money'],
            featured: true,
            verification_status: 'verified',
            is_visible: true,
            created_at: new Date().toISOString(),
            seller_id: 'demo-seller',
            is_for_sale: true,
            sale_status: 'available'
          }
        ]
        setDomains(demoData as Domain[])
        return
      }

      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('is_visible', true)
        .eq('verification_status', 'verified')
        .eq('is_for_sale', true)
        .eq('sale_status', 'available')

      if (error) {
        console.error('Error loading domains:', error)
        return
      }

      setDomains(data || [])
    } catch (error) {
      console.error('Error in loadDomains:', error)
    }
  }

  const filterAndSortDomains = () => {
    let filtered = [...domains]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(domain =>
        domain.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(domain => domain.category === selectedCategory)
    }

    // Sort domains
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price
        case 'price-high':
          return b.price - a.price
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'name':
        default:
          return a.name.localeCompare(b.name)
      }
    })

    setFilteredDomains(filtered)
  }

  // Modified handleDomainClick to initiate Stripe Checkout
  const handleDomainClick = async (domain: Domain) => {
    if (!user) {
      alert('Please log in to purchase a domain.');
      navigate('/login'); // Redirect to login page
      return;
    }

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        alert('Could not get authentication token. Please log in again.');
        navigate('/login');
        return;
      }

      // Construct the full success and cancel URLs
      const currentOrigin = window.location.origin;
      const successUrl = `${currentOrigin}/success`;
      const cancelUrl = `${currentOrigin}/`; // Redirect to home on cancel

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          domain_id: domain.id,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error initiating checkout:', data.error);
        alert(`Error initiating checkout: ${data.error || 'Unknown error'}`);
        return;
      }

      if (data.url) {
        window.location.href = data.url; // Redirect to Stripe Checkout
      } else {
        alert('Failed to get Stripe checkout URL.');
      }

    } catch (error) {
      console.error('Network or unexpected error during checkout:', error);
      alert('An unexpected error occurred during checkout. Please try again.');
    }
  }

  const handleCloseContactForm = () => {
    setShowContactForm(false)
    setSelectedDomain(null)
  }

  const handleSellerAuthSuccess = (id: string) => {
    setSellerId(id)
    setShowSellerAuth(false)
  }

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true)
    setShowAdminLogin(false)
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setIsAdmin(false)
    setSellerId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/seller-dashboard" element={
            sellerId ? (
              <SellerDashboard
                sellerId={sellerId}
                onLogout={() => setSellerId(null)}
              />
            ) : (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                  <p className="text-gray-600 mb-6">Please log in as a seller to access this page.</p>
                  <button
                    onClick={() => setShowSellerAuth(true)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Seller Login
                  </button>
                </div>
              </div>
            )
          } />
          <Route path="/admin" element={
            isAdmin ? (
              <AdminDashboard onLogout={handleLogout} />
            ) : (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
                  <p className="text-gray-600 mb-6">Please log in with admin credentials.</p>
                  <button
                    onClick={() => setShowAdminLogin(true)}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
                  >
                    Admin Login
                  </button>
                </div>
              </div>
            )
          } />
          <Route path="/admin/approval" element={
            isAdmin ? (
              <AdminApproval onLogout={handleLogout} />
            ) : (
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
                  <p className="text-gray-600">You need admin privileges to access this page.</p>
                </div>
              </div>
            )
          } />
          <Route path="/" element={
            <>
              <Hero
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                user={user}
                onSellerAuth={() => { console.log('onSellerAuth triggered'); setShowSellerAuth(true); }}
                onAdminLogin={() => setShowAdminLogin(true)}
                onLogout={handleLogout}
                isAdmin={isAdmin}
              />
              <div data-marketplace>
                <FilterBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  domains={domains}
                />
                <DomainGrid
                  domains={filteredDomains}
                  onDomainClick={handleDomainClick}
                  viewMode={viewMode}
                />
              </div>
            </>
          } />
        </Routes>

        {showContactForm && selectedDomain && (
          <ContactForm
            domain={selectedDomain}
            onClose={handleCloseContactForm}
          />
        )}

        {showSellerAuth && (
          <SellerAuth
            onClose={() => setShowSellerAuth(false)}
            onSuccess={handleSellerAuthSuccess}
          />
        )}

        {showAdminLogin && (
          <AdminLogin
            onClose={() => setShowAdminLogin(false)}
            onSuccess={handleAdminLoginSuccess}
          />
        )}
      </div>
    </Router>
  )
}

export default App