export interface StripeProduct {
  priceId: string
  name: string
  description: string
  mode: 'payment' | 'subscription'
  price: number
  category: string
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1RfUfgBR6WHXENLN4BiaY9P1',
    name: 'placeholder_domain.com',
    description: 'Premium placeholder domain for testing purposes. Perfect for development and demo projects.',
    mode: 'payment',
    price: 100,
    category: 'Technology'
  }
]

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId)
}