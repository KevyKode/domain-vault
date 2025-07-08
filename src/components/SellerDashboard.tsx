// src/components/SellerDashboard.tsx

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

interface Domain {
  id: number;
  name: string;
  price: number;
}

const SellerDashboard = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [delistingId, setDelistingId] = useState<number | null>(null);

  const fetchListedDomains = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDomains([]);
        setLoading(false);
        return;
      }

      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (sellerError || !sellerData) {
        setDomains([]);
        setLoading(false);
        return;
      }
      const sellerId = sellerData.id;

      const { data, error } = await supabase
        .from('domains')
        .select('id, name, price')
        .eq('seller_id', sellerId)
        .eq('is_listed', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDomains(data || []);
      
    } catch (err) {
      console.error("Error fetching listed domains:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch your listed domains.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListedDomains();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => { // <-- FIX #1: session is now _session
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            fetchListedDomains();
        }
    });

    return () => {
        authListener?.subscription.unsubscribe();
    };
  }, [fetchListedDomains]);

  const handleDelist = async (domainId: number) => {
    setDelistingId(domainId);
    setError('');

    try {
      const { error } = await supabase
        .from('domains')
        .update({ is_listed: false })
        .eq('id', domainId);
      
      if (error) throw error;

      setDomains(currentDomains =>
        currentDomains.filter(domain => domain.id !== domainId)
      );

    } catch (err) {
      if (err instanceof Error) {
        // FIX #2: Removed the use of 'any' and '.reason' for a safer, cleaner error message.
        setError(err.message); 
      } else {
        setError('Failed to delist domain. An unknown error occurred.');
      }
    } finally {
      setDelistingId(null);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-400 py-8">Loading your domains...</p>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-800 rounded-lg shadow-xl mt-8">
      <h2 className="text-2xl font-bold text-white mb-6">Your Listed Domains</h2>
      
      {error && <p className="text-center text-red-400 bg-red-900/50 p-3 rounded-md mb-4">{error}</p>}
      
      {!loading && domains.length === 0 && (
        <p className="text-center text-gray-400">You have not listed any domains yet.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain) => {
          const isDelisting = delistingId === domain.id;
          return (
            <div key={domain.id} className="bg-gray-900 rounded-lg p-6 shadow-md border border-gray-700 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white truncate">{domain.name}</h3>
                <p className="text-indigo-400 text-lg mt-2">${domain.price.toFixed(2)}</p>
              </div>
              <button
                onClick={() => handleDelist(domain.id)}
                disabled={isDelisting}
                className={`w-full mt-4 py-2 px-4 rounded-md font-semibold text-white transition-colors duration-200 ${isDelisting ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
              >
                {isDelisting ? 'Delisting...' : 'Delist'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SellerDashboard;