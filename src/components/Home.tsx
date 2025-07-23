import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase, Domain } from '../lib/supabase';
import Hero from './Hero';
import FilterBar from './FilterBar';
import DomainGrid from './DomainGrid';
import DomainVaultLogo from './DomainVaultLogo';
import { Link } from 'react-router-dom';

interface HomeProps {
  session: Session | null;
}

export default function Home({ session }: HomeProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  useEffect(() => {
    fetchDomains();
  }, []);

  useEffect(() => {
    filterDomains();
  }, [domains, searchTerm, selectedCategory, priceRange]);

  const fetchDomains = async () => {
    try {
      if (!supabase) {
        console.log('Supabase not available, using demo mode');
        setDomains([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('domains')
        .select(`
          *,
          seller:sellers(*)
        `)
        .eq('is_visible', true)
        .eq('verification_status', 'verified')
        .eq('is_for_sale', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching domains:', error);
        setDomains([]);
      } else {
        setDomains(data || []);
      }
    } catch (error) {
      console.error('Error fetching domains:', error);
      setDomains([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <DomainVaultLogo />
                <span className="ml-2 text-xl font-bold text-gray-900">DomainVault</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/list-domain" 
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                List Domain
              </Link>
              
              {session ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/seller/dashboard" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => supabase?.auth.signOut()}
                    className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login" 
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/signup" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <FilterBar
          onSearch={handleSearch}
          onCategoryChange={handleCategoryChange}
          onPriceRangeChange={handlePriceRangeChange}
          searchTerm={searchTerm}
          selectedCategory={selectedCategory}
          priceRange={priceRange}
        />

        {/* Domain Grid */}
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <DomainGrid domains={filteredDomains} />
          )}
        </div>

        {/* No Results */}
        {!loading && filteredDomains.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No domains found</h3>
            <p className="text-gray-600 mb-4">
              {domains.length === 0 
                ? "No domains are currently listed for sale." 
                : "Try adjusting your search criteria."}
            </p>
            <Link 
              to="/list-domain" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              List Your Domain
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <DomainVaultLogo />
                <span className="ml-2 text-xl font-bold">DomainVault</span>
              </div>
              <p className="text-gray-400">
                The premier marketplace for buying and selling premium domain names.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Marketplace</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/" className="hover:text-white">Browse Domains</Link></li>
                <li><Link to="/list-domain" className="hover:text-white">List Domain</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Account</h3>
              <ul className="space-y-2 text-gray-400">
                {session ? (
                  <>
                    <li><Link to="/seller/dashboard" className="hover:text-white">Dashboard</Link></li>
                    <li><Link to="/subscription" className="hover:text-white">Subscription</Link></li>
                  </>
                ) : (
                  <>
                    <li><Link to="/login" className="hover:text-white">Sign In</Link></li>
                    <li><Link to="/signup" className="hover:text-white">Sign Up</Link></li>
                  </>
                )}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/contact" className="hover:text-white">Help Center</Link></li>
                <li><a href="mailto:support@domainvault.com" className="hover:text-white">Email Support</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DomainVault. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}