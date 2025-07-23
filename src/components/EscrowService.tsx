import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface EscrowTransaction {
  id: string;
  domain_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'disputed' | 'cancelled';
  created_at: string;
  updated_at: string;
  domain?: {
    name: string;
    price: number;
  };
}

interface EscrowServiceProps {
  session: Session | null;
  domainId?: string;
  onTransactionComplete?: (transactionId: string) => void;
}

export default function EscrowService({ session, domainId, onTransactionComplete }: EscrowServiceProps) {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<EscrowTransaction | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (session) {
      fetchTransactions();
    }
  }, [session]);

  const fetchTransactions = async () => {
    if (!supabase || !session) return;

    try {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .select(`
          *,
          domain:domains(name, price)
        `)
        .or(`buyer_id.eq.${session.user.id},seller_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching escrow transactions:', error);
      } else {
        setTransactions(data || []);
      }
    } catch (error) {
      console.error('Error fetching escrow transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const createEscrowTransaction = async (domainId: string, sellerId: string, amount: number) => {
    if (!supabase || !session) return;

    try {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .insert([
          {
            domain_id: domainId,
            buyer_id: session.user.id,
            seller_id: sellerId,
            amount: amount,
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating escrow transaction:', error);
        alert('Failed to create escrow transaction');
      } else {
        setTransactions([data, ...transactions]);
        setShowCreateModal(false);
        if (onTransactionComplete) {
          onTransactionComplete(data.id);
        }
      }
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      alert('Failed to create escrow transaction');
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('escrow_transactions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) {
        console.error('Error updating transaction status:', error);
        alert('Failed to update transaction status');
      } else {
        fetchTransactions(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('Failed to update transaction status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'funded': return 'bg-blue-100 text-blue-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canPerformAction = (transaction: EscrowTransaction, action: string) => {
    if (!session) return false;

    const isBuyer = transaction.buyer_id === session.user.id;
    const isSeller = transaction.seller_id === session.user.id;

    switch (action) {
      case 'fund':
        return isBuyer && transaction.status === 'pending';
      case 'release':
        return isBuyer && transaction.status === 'funded';
      case 'dispute':
        return (isBuyer || isSeller) && transaction.status === 'funded';
      case 'cancel':
        return (isBuyer || isSeller) && transaction.status === 'pending';
      default:
        return false;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Escrow Transactions</h2>
        {domainId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Escrow
          </button>
        )}
      </div>

      {/* Escrow Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">How Escrow Works</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>• <strong>Step 1:</strong> Buyer creates escrow transaction and funds it</p>
          <p>• <strong>Step 2:</strong> Seller transfers domain ownership</p>
          <p>• <strong>Step 3:</strong> Buyer confirms receipt and releases funds</p>
          <p>• <strong>Protection:</strong> Funds are held securely until both parties are satisfied</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No escrow transactions found</p>
          </div>
        ) : (
          transactions.map((transaction) => (
            <div key={transaction.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {transaction.domain?.name || 'Domain Transaction'}
                  </h3>
                  <p className="text-gray-600">
                    Amount: ${transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {new Date(transaction.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                </span>
              </div>

              <div className="flex space-x-2">
                {canPerformAction(transaction, 'fund') && (
                  <button
                    onClick={() => updateTransactionStatus(transaction.id, 'funded')}
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                  >
                    Fund Escrow
                  </button>
                )}
                
                {canPerformAction(transaction, 'release') && (
                  <button
                    onClick={() => updateTransactionStatus(transaction.id, 'released')}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  >
                    Release Funds
                  </button>
                )}
                
                {canPerformAction(transaction, 'dispute') && (
                  <button
                    onClick={() => updateTransactionStatus(transaction.id, 'disputed')}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                  >
                    Dispute
                  </button>
                )}
                
                {canPerformAction(transaction, 'cancel') && (
                  <button
                    onClick={() => updateTransactionStatus(transaction.id, 'cancelled')}
                    className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Escrow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Escrow Transaction</h3>
            <p className="text-gray-600 mb-4">
              This will create a secure escrow transaction for the domain purchase.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // This would normally get domain details and create the transaction
                  // For now, we'll just close the modal
                  setShowCreateModal(false);
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}