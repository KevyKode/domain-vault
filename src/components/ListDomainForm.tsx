// src/components/ListDomainForm.tsx

import { useState } from 'react';
import { supabase } from '../supabaseClient';

const ListDomainForm = () => {
  const [domainName, setDomainName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // 1. Get the current logged-in user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("You must be logged in to list a domain.");
      }

      // 2. Find the corresponding entry in your 'sellers' table
      //    This assumes your 'sellers' table has a 'user_id' column that is a foreign key to 'auth.users.id'
      const { data: sellerData, error: sellerError } = await supabase
        .from('sellers')
        .select('id')
        .eq('user_id', user.id)
        .single(); // We expect only one seller profile per user

      if (sellerError || !sellerData) {
        throw new Error("Could not find a seller profile for your account. Please complete your seller profile first.");
      }
      const sellerId = sellerData.id;

      // 3. Insert the new domain into your 'domains' table
      //    IMPORTANT: Adjust the column names ('name', 'price', 'seller_id') if yours are different!
      const { error: insertError } = await supabase
        .from('domains')
        .insert({
          name: domainName,
          price: parseFloat(price),
          seller_id: sellerId,
          is_listed: true // Assuming you have this column to track status
        });

      if (insertError) {
        // Handle if the domain is already listed (unique constraint violation)
        if (insertError.code === '23505') {
            throw new Error(`The domain "${domainName}" is already listed.`);
        }
        throw insertError;
      }
      
      setMessageType('success');
      setMessage('Domain listed successfully! Refreshing your dashboard...');
      setDomainName('');
      setPrice('');
      
      // A simple way to refresh the dashboard is to reload the page after a short delay
      setTimeout(() => window.location.reload(), 2000);

    } catch (err) { // Step 1: Catch the error without a type
  setMessageType('error');
  // Step 2: Check if it's an object with a 'message' property before using it
  if (err instanceof Error) {
    setMessage(err.message);
  } else {
    setMessage('An unknown error occurred. Please try again.');
  }
} finally {
  setLoading(false);
}
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-800 rounded-lg shadow-xl max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">List a New Domain</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form inputs are the same as before */}
        <div>
          <label htmlFor="domainName" className="block text-sm font-medium text-gray-300">Domain Name</label>
          <input id="domainName" type="text" value={domainName} onChange={(e) => setDomainName(e.target.value)} placeholder="example.com" className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-300">Price (USD)</label>
          <input id="price" type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="100.00" className="w-full mt-1 p-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-indigo-500 focus:border-indigo-500" required />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors">
          {loading ? 'Listing...' : 'List Domain'}
        </button>
      </form>
      {message && (
        <p className={`mt-4 text-center text-sm ${messageType === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default ListDomainForm;