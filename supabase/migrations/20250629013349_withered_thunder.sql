/*
  # Secure Domain Marketplace Schema

  1. New Tables
    - `sellers` - User accounts for domain sellers
    - `domain_verifications` - Track ownership verification attempts
    - `verification_tokens` - Store DNS verification tokens
    - Updated `domains` table with seller ownership and verification status
    - Updated `inquiries` table to link to sellers

  2. Security
    - Enable RLS on all new tables
    - Add policies for seller data access
    - Add verification status checks

  3. Features
    - Email verification for sellers
    - DNS TXT record verification
    - Domain registrar API integration support
    - Document upload verification
    - Automated ownership checks
*/

-- Create sellers table for user accounts
CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name text NOT NULL,
  company_name text,
  phone text,
  email_verified boolean DEFAULT false,
  email_verification_token text,
  email_verification_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create verification tokens table for DNS verification
CREATE TABLE IF NOT EXISTS verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  token text NOT NULL,
  verification_type text NOT NULL CHECK (verification_type IN ('dns_txt', 'registrar_api', 'document_upload')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Create domain verifications table to track verification attempts
CREATE TABLE IF NOT EXISTS domain_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name text NOT NULL,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  verification_type text NOT NULL CHECK (verification_type IN ('dns_txt', 'registrar_api', 'document_upload')),
  verification_token text,
  verification_data jsonb, -- Store additional verification data
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed', 'expired')),
  verified_at timestamptz,
  expires_at timestamptz,
  last_checked_at timestamptz,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Drop existing domains table and recreate with seller ownership
DROP TABLE IF EXISTS domains CASCADE;

CREATE TABLE domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  featured boolean NOT NULL DEFAULT false,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'failed', 'expired')),
  verification_id uuid REFERENCES domain_verifications(id),
  is_visible boolean NOT NULL DEFAULT false, -- Only visible after verification
  last_ownership_check timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Update inquiries table to link to sellers
DROP TABLE IF EXISTS inquiries CASCADE;

CREATE TABLE inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_name text NOT NULL,
  buyer_email text NOT NULL CHECK (buyer_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'closed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Sellers policies
CREATE POLICY "Sellers can read own data"
  ON sellers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Sellers can update own data"
  ON sellers
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Anyone can create seller account"
  ON sellers
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Verification tokens policies
CREATE POLICY "Sellers can manage own verification tokens"
  ON verification_tokens
  FOR ALL
  TO authenticated
  USING (seller_id = auth.uid());

-- Domain verifications policies
CREATE POLICY "Sellers can manage own domain verifications"
  ON domain_verifications
  FOR ALL
  TO authenticated
  USING (seller_id = auth.uid());

-- Domains policies
CREATE POLICY "Anyone can view verified domains"
  ON domains
  FOR SELECT
  TO public
  USING (is_visible = true AND verification_status = 'verified');

CREATE POLICY "Sellers can manage own domains"
  ON domains
  FOR ALL
  TO authenticated
  USING (seller_id = auth.uid());

-- Inquiries policies
CREATE POLICY "Anyone can submit inquiries"
  ON inquiries
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Sellers can view inquiries for their domains"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can update inquiries for their domains"
  ON inquiries
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid());

-- Create updated_at triggers
CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domain_verifications_updated_at
  BEFORE UPDATE ON domain_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_domains_seller_id ON domains(seller_id);
CREATE INDEX idx_domains_verification_status ON domains(verification_status);
CREATE INDEX idx_domains_is_visible ON domains(is_visible);
CREATE INDEX idx_domain_verifications_seller_id ON domain_verifications(seller_id);
CREATE INDEX idx_domain_verifications_domain_name ON domain_verifications(domain_name);
CREATE INDEX idx_verification_tokens_domain_name ON verification_tokens(domain_name);
CREATE INDEX idx_inquiries_seller_id ON inquiries(seller_id);
CREATE INDEX idx_inquiries_domain_id ON inquiries(domain_id);

-- Insert sample seller data
INSERT INTO sellers (id, email, full_name, company_name, email_verified) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'john@domainpro.com', 'John Smith', 'Domain Pro LLC', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'sarah@techdomains.com', 'Sarah Johnson', 'Tech Domains Inc', true);

-- Insert sample verified domains
INSERT INTO domains (name, seller_id, price, category, description, tags, featured, verification_status, is_visible) VALUES
  ('techstartup.com', '550e8400-e29b-41d4-a716-446655440000', 15000, 'Technology', 'Perfect domain for technology startups and innovative companies', ARRAY['tech', 'startup', 'innovation'], true, 'verified', true),
  ('ecommercepro.com', '550e8400-e29b-41d4-a716-446655440000', 25000, 'E-commerce', 'Premium domain for e-commerce businesses and online stores', ARRAY['ecommerce', 'business', 'premium'], true, 'verified', true),
  ('healthplus.com', '550e8400-e29b-41d4-a716-446655440001', 18000, 'Health', 'Ideal for healthcare providers and wellness companies', ARRAY['health', 'wellness', 'medical'], false, 'verified', true),
  ('financeexpert.com', '550e8400-e29b-41d4-a716-446655440001', 22000, 'Finance', 'Professional domain for financial services and consulting', ARRAY['finance', 'consulting', 'professional'], false, 'verified', true);

-- Insert sample domain verifications
INSERT INTO domain_verifications (domain_name, seller_id, verification_type, status, verified_at) VALUES
  ('techstartup.com', '550e8400-e29b-41d4-a716-446655440000', 'dns_txt', 'verified', now() - interval '1 day'),
  ('ecommercepro.com', '550e8400-e29b-41d4-a716-446655440000', 'dns_txt', 'verified', now() - interval '2 days'),
  ('healthplus.com', '550e8400-e29b-41d4-a716-446655440001', 'registrar_api', 'verified', now() - interval '3 days'),
  ('financeexpert.com', '550e8400-e29b-41d4-a716-446655440001', 'document_upload', 'verified', now() - interval '1 week');

-- Insert sample inquiries
INSERT INTO inquiries (domain_id, seller_id, buyer_name, buyer_email, message) VALUES
  ((SELECT id FROM domains WHERE name = 'techstartup.com'), '550e8400-e29b-41d4-a716-446655440000', 'Mike Chen', 'mike@startup.com', 'I am interested in purchasing this domain for my new tech startup. Could we discuss pricing and transfer process?'),
  ((SELECT id FROM domains WHERE name = 'ecommercepro.com'), '550e8400-e29b-41d4-a716-446655440000', 'Lisa Wang', 'lisa@business.com', 'This domain would be perfect for our e-commerce platform. What is your best price?'),
  ((SELECT id FROM domains WHERE name = 'healthplus.com'), '550e8400-e29b-41d4-a716-446655440001', 'David Brown', 'david@healthcorp.com', 'We are a healthcare company looking to rebrand. Is this domain still available?');