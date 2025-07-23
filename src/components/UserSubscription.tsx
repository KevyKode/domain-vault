import React, { useState, useEffect } from 'react'
import { Crown, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { getProductByPriceId } from '../stripe-config'

interface SubscriptionData {
  subscription_status: string
  price_id: string | null
  current_period_end: number | null
  cancel_at_period_end: boolean
  payment_method_brand: string | null
  payment_method_last4: string | null
}

export default function UserSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .maybeSingle()

      if (error) throw error
      setSubscription(data)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Error loading subscription: {error}</span>
        </div>
      </div>
    )
  }

  if (!subscription || subscription.subscription_status === 'not_started') {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="text-center">
          <Crown className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Active Subscription</h3>
          <p className="text-gray-600">You don't have an active subscription yet.</p>
        </div>
      </div>
    )
  }

  const product = subscription.price_id ? getProductByPriceId(subscription.price_id) : null
  const isActive = subscription.subscription_status === 'active'
  const endDate = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'past_due': return 'text-yellow-600 bg-yellow-100'
      case 'canceled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Crown className="h-5 w-5 mr-2 text-yellow-500" />
          Subscription Status
        </h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.subscription_status)}`}>
          {subscription.subscription_status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {product && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Current Plan</p>
          <p className="font-semibold text-gray-900">{product.name}</p>
        </div>
      )}

      {endDate && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {subscription.cancel_at_period_end ? 'Expires on' : 'Renews on'}
          </p>
          <p className="font-medium text-gray-900">{endDate.toLocaleDateString()}</p>
        </div>
      )}

      {subscription.payment_method_brand && subscription.payment_method_last4 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 flex items-center">
            <CreditCard className="h-4 w-4 mr-1" />
            Payment Method
          </p>
          <p className="font-medium text-gray-900">
            {subscription.payment_method_brand.toUpperCase()} •••• {subscription.payment_method_last4}
          </p>
        </div>
      )}

      {subscription.cancel_at_period_end && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Your subscription will not renew and will end on {endDate?.toLocaleDateString()}.
          </p>
        </div>
      )}
    </div>
  )
}