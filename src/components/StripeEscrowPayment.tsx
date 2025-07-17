import React, { useState } from 'react';
import { Session } from '@supabase/supabase-js';

interface StripeEscrowPaymentProps {
  session: Session | null;
  escrowTransactionId: string;
  amount: number;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onPaymentError: (error: string) => void;
}

export default function StripeEscrowPayment({
  session,
  escrowTransactionId,
  amount,
  onPaymentSuccess,
  onPaymentError
}: StripeEscrowPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handlePayment = async () => {
    if (!session) {
      onPaymentError('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // In a real implementation, this would:
      // 1. Create a Stripe Payment Intent on the backend
      // 2. Use Stripe Elements to collect payment information
      // 3. Confirm the payment
      // 4. Update the escrow transaction status

      // For demo purposes, we'll simulate a successful payment
      setTimeout(() => {
        const mockPaymentIntentId = `pi_${Math.random().toString(36).substr(2, 9)}`;
        onPaymentSuccess(mockPaymentIntentId);
        setLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      onPaymentError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Secure Escrow Payment</h3>
      
      {/* Payment Amount */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Domain Purchase</span>
          <span className="font-semibold">${amount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Marketplace Fee (1%)</span>
          <span className="font-semibold">${(amount * 0.01).toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between items-center">
          <span className="font-semibold text-gray-900">Total</span>
          <span className="font-bold text-lg">${(amount * 1.01).toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Method
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm">Credit/Debit Card</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="bank"
              checked={paymentMethod === 'bank'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <span className="text-sm">Bank Transfer (ACH)</span>
          </label>
        </div>
      </div>

      {/* Card Payment Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CVC
              </label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {/* Bank Transfer Info */}
      {paymentMethod === 'bank' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-900 mb-2">Bank Transfer Instructions</h4>
          <div className="text-sm text-blue-800 space-y-1">
            <p><strong>Account Name:</strong> DomainVault Escrow</p>
            <p><strong>Account Number:</strong> 1234567890</p>
            <p><strong>Routing Number:</strong> 021000021</p>
            <p><strong>Reference:</strong> {escrowTransactionId}</p>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Please include the reference number in your transfer description.
          </p>
        </div>
      )}

      {/* Security Notice */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div>
            <h4 className="font-semibold text-green-900 text-sm">Secure Escrow Protection</h4>
            <p className="text-xs text-green-800 mt-1">
              Your funds are held securely until the domain transfer is complete. 
              The seller cannot access funds until you confirm receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors ${
          loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing Payment...
          </div>
        ) : (
          `Fund Escrow - $${(amount * 1.01).toFixed(2)}`
        )}
      </button>

      {/* Terms */}
      <p className="text-xs text-gray-500 mt-4 text-center">
        By proceeding, you agree to our{' '}
        <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        {' '}and{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
        Your payment is protected by our escrow service.
      </p>
    </div>
  );
}