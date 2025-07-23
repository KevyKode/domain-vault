import { createClient } from '@supabase/supabase-js'

// Check if environment variables exist and are valid URLs
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? 'configured' : 'missing',
  key: supabaseAnonKey ? 'configured' : 'missing'
})

// Validate URL format safely
const isValidUrl = (url: string) => {
  if (!url || typeof url !== 'string') return false
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'https:' || urlObj.protocol === 'http:'
  } catch {
    return false
  }
}

// Check if the configuration contains placeholder values
const isPlaceholderConfig = (url: string, key: string) => {
  if (!url || !key) return true
  
  // Check for common placeholder patterns
  const placeholderPatterns = [
    'your-project-ref',
    'your-actual-anon-key-here',
    'abcdefghijklmnop',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  ]
  
  return placeholderPatterns.some(pattern => 
    url.includes(pattern) || key.includes(pattern)
  )
}

// Determine if we should create a real Supabase client
const shouldCreateClient = supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl) && 
  !isPlaceholderConfig(supabaseUrl, supabaseAnonKey)

// Create a fallback client or real client
export const supabase = shouldCreateClient
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Log the configuration
console.log('Supabase client configuration:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  isValidUrl: supabaseUrl ? isValidUrl(supabaseUrl) : false,
  isPlaceholder: isPlaceholderConfig(supabaseUrl || '', supabaseAnonKey || ''),
  clientCreated: !!supabase,
  mode: supabase ? 'connected' : 'demo'
})

export type Seller = {
  id: string
  email: string
  full_name: string
  company_name?: string
  phone?: string
  email_verified: boolean
  email_verification_token?: string
  email_verification_expires_at?: string
  created_at: string
  updated_at: string
}

export type Domain = {
  id: string
  name: string
  seller_id: string
  price: number
  category: string
  description?: string
  tags: string[]
  featured: boolean
  verification_status: 'unverified' | 'pending' | 'verified' | 'failed' | 'expired'
  verification_id?: string
  is_visible: boolean
  last_ownership_check?: string
  created_at: string
  updated_at: string
  seller?: Seller
  is_for_sale?: boolean
  sale_status?: string
  sold_at?: string
  buyer_id?: string
}

export type DomainVerification = {
  id: string
  domain_name: string
  seller_id: string
  verification_type: 'dns_txt' | 'registrar_api' | 'document_upload'
  verification_token?: string
  verification_data?: any
  status: 'pending' | 'verified' | 'failed' | 'expired'
  verified_at?: string
  expires_at?: string
  last_checked_at?: string
  failure_reason?: string
  created_at: string
  updated_at: string
}

export type VerificationToken = {
  id: string
  domain_name: string
  seller_id: string
  token: string
  verification_type: 'dns_txt' | 'registrar_api' | 'document_upload'
  expires_at: string
  created_at: string
}

export type Inquiry = {
  id: string
  domain_id: string
  seller_id: string
  buyer_name: string
  buyer_email: string
  message: string
  status: 'new' | 'replied' | 'closed'
  created_at: string
  domain?: Domain
}

// Verification utilities
export const generateVerificationToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export const createDNSVerificationRecord = (domain: string, token: string): string => {
  return `domain-verification=${token}`
}

// DNS verification check (would integrate with DNS lookup service)
export const checkDNSVerification = async (domain: string, token: string): Promise<boolean> => {
  // In a real implementation, this would query DNS records
  // For demo purposes, we'll simulate verification
  console.log(`Checking DNS verification for ${domain} with token ${token}`)
  return Math.random() > 0.3 // 70% success rate for demo
}

// Domain ownership verification functions
export const initiateDomainVerification = async (
  sellerId: string,
  domainName: string,
  verificationType: 'dns_txt' | 'registrar_api' | 'document_upload'
) => {
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  const token = generateVerificationToken()
  
  // Create verification token
  const { data: tokenData, error: tokenError } = await supabase
    .from('verification_tokens')
    .insert([{
      domain_name: domainName,
      seller_id: sellerId,
      token,
      verification_type: verificationType
    }])
    .select()
    .single()

  if (tokenError) throw tokenError

  // Create verification record
  const { data: verificationData, error: verificationError } = await supabase
    .from('domain_verifications')
    .insert([{
      domain_name: domainName,
      seller_id: sellerId,
      verification_type: verificationType,
      verification_token: token,
      status: 'pending'
    }])
    .select()
    .single()

  if (verificationError) throw verificationError

  return { token: tokenData, verification: verificationData }
}

export const verifyDomainOwnership = async (verificationId: string) => {
  if (!supabase) {
    throw new Error('Supabase client not available')
  }
  
  const { data: verification, error } = await supabase
    .from('domain_verifications')
    .select('*')
    .eq('id', verificationId)
    .single()

  if (error) throw error

  let isVerified = false
  let failureReason = ''

  switch (verification.verification_type) {
    case 'dns_txt':
      isVerified = await checkDNSVerification(verification.domain_name, verification.verification_token!)
      if (!isVerified) failureReason = 'DNS TXT record not found or incorrect'
      break
    case 'registrar_api':
      // Would integrate with registrar APIs
      isVerified = Math.random() > 0.2 // 80% success rate for demo
      if (!isVerified) failureReason = 'Registrar API verification failed'
      break
    case 'document_upload':
      // Would verify uploaded documents
      isVerified = Math.random() > 0.1 // 90% success rate for demo
      if (!isVerified) failureReason = 'Document verification failed'
      break
  }

  const status = isVerified ? 'verified' : 'failed'
  const updateData: any = {
    status,
    last_checked_at: new Date().toISOString()
  }

  if (isVerified) {
    updateData.verified_at = new Date().toISOString()
  } else {
    updateData.failure_reason = failureReason
  }

  const { error: updateError } = await supabase
    .from('domain_verifications')
    .update(updateData)
    .eq('id', verificationId)

  if (updateError) throw updateError

  // Update domain verification status
  if (isVerified) {
    await supabase
      .from('domains')
      .update({
        verification_status: 'verified',
        verification_id: verificationId,
        is_visible: true
      })
      .eq('name', verification.domain_name)
      .eq('seller_id', verification.seller_id)
  }

  return { isVerified, failureReason }
}
