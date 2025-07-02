import { supabase } from './supabase'
import { stripeProducts } from '../stripe-config'

interface CreateCheckoutSessionParams {
  priceId: string
  mode: 'payment' | 'subscription'
  successUrl: string
  cancelUrl: string
}

interface CreateDomainCheckoutSessionParams {
  domainId: string
  successUrl: string
  cancelUrl: string
}

interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

export async function createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('You must be logged in to make a purchase')
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      price_id: params.priceId,
      mode: params.mode,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  return response.json()
}

export async function createDomainCheckoutSession(params: CreateDomainCheckoutSessionParams): Promise<CheckoutSessionResponse> {
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    throw new Error('You must be logged in to purchase a domain')
  }

  // Check if this is a Stripe test domain
  if (params.domainId.startsWith('stripe-')) {
    const priceId = params.domainId.replace('stripe-', '')
    const product = stripeProducts.find(p => p.priceId === priceId)
    
    if (!product) {
      throw new Error('Product not found')
    }

    // Use regular checkout for Stripe products
    return createCheckoutSession({
      priceId: product.priceId,
      mode: product.mode,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl
    })
  }

  // Handle real domain purchases
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/domain-purchase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({
      domain_id: params.domainId,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl
    })
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create domain checkout session')
  }

  return response.json()
}