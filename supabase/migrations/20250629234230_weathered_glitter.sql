/*
  # Domain Sales System with Transaction Fees

  1. New Tables
    - `domain_sales` - Track domain sale transactions
    - `marketplace_transactions` - Record all financial transactions
    - `seller_payouts` - Track payouts to sellers

  2. Updates
    - Add sale-related fields to domains table
    - Update Stripe integration for marketplace payments

  3. Security
    - Enable RLS on all new tables
    - Add policies for transaction access
*/

-- Add sale-related fields to domains table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'is_for_sale'
  ) THEN
    ALTER TABLE domains ADD COLUMN is_for_sale boolean NOT NULL DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'sale_status'
  ) THEN
    ALTER TABLE domains ADD COLUMN sale_status text NOT NULL DEFAULT 'available' CHECK (sale_status IN ('available', 'pending', 'sold', 'withdrawn'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'sold_at'
  ) THEN
    ALTER TABLE domains ADD COLUMN sold_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'domains' AND column_name = 'buyer_id'
  ) THEN
    ALTER TABLE domains ADD COLUMN buyer_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Create domain sales table
CREATE TABLE IF NOT EXISTS domain_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  sale_price numeric NOT NULL CHECK (sale_price > 0),
  marketplace_fee numeric NOT NULL CHECK (marketplace_fee >= 0),
  seller_amount numeric NOT NULL CHECK (seller_amount >= 0),
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create marketplace transactions table
CREATE TABLE IF NOT EXISTS marketplace_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL CHECK (transaction_type IN ('domain_sale', 'marketplace_fee', 'seller_payout')),
  domain_sale_id uuid REFERENCES domain_sales(id),
  user_id uuid REFERENCES auth.users(id),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  stripe_transaction_id text,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create seller payouts table
CREATE TABLE IF NOT EXISTS seller_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  domain_sale_id uuid NOT NULL REFERENCES domain_sales(id),
  amount numeric NOT NULL CHECK (amount > 0),
  stripe_transfer_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  processed_at timestamptz,
  failure_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE domain_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_payouts ENABLE ROW LEVEL SECURITY;

-- Domain sales policies
CREATE POLICY "Sellers can view their domain sales"
  ON domain_sales
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Buyers can view their purchases"
  ON domain_sales
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "System can manage domain sales"
  ON domain_sales
  FOR ALL
  TO service_role
  USING (true);

-- Marketplace transactions policies
CREATE POLICY "Users can view their transactions"
  ON marketplace_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can manage transactions"
  ON marketplace_transactions
  FOR ALL
  TO service_role
  USING (true);

-- Seller payouts policies
CREATE POLICY "Sellers can view their payouts"
  ON seller_payouts
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "System can manage payouts"
  ON seller_payouts
  FOR ALL
  TO service_role
  USING (true);

-- Create updated_at triggers
CREATE TRIGGER update_domain_sales_updated_at
  BEFORE UPDATE ON domain_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_payouts_updated_at
  BEFORE UPDATE ON seller_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_domain_sales_seller_id ON domain_sales(seller_id);
CREATE INDEX IF NOT EXISTS idx_domain_sales_buyer_id ON domain_sales(buyer_id);
CREATE INDEX IF NOT EXISTS idx_domain_sales_domain_id ON domain_sales(domain_id);
CREATE INDEX IF NOT EXISTS idx_domain_sales_status ON domain_sales(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_user_id ON marketplace_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_transactions_type ON marketplace_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_seller_payouts_seller_id ON seller_payouts(seller_id);
CREATE INDEX IF NOT EXISTS idx_domains_sale_status ON domains(sale_status);
CREATE INDEX IF NOT EXISTS idx_domains_is_for_sale ON domains(is_for_sale);

-- Add Stripe Connect account field to sellers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'stripe_account_id'
  ) THEN
    ALTER TABLE sellers ADD COLUMN stripe_account_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'stripe_account_status'
  ) THEN
    ALTER TABLE sellers ADD COLUMN stripe_account_status text DEFAULT 'not_connected' CHECK (stripe_account_status IN ('not_connected', 'pending', 'connected', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sellers' AND column_name = 'payout_enabled'
  ) THEN
    ALTER TABLE sellers ADD COLUMN payout_enabled boolean DEFAULT false;
  END IF;
END $$;

-- Function to calculate marketplace fee (1%)
CREATE OR REPLACE FUNCTION calculate_marketplace_fee(sale_price numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN ROUND(sale_price * 0.01, 2);
END;
$$;

-- Function to calculate seller amount after fees
CREATE OR REPLACE FUNCTION calculate_seller_amount(sale_price numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
DECLARE
  marketplace_fee numeric;
BEGIN
  marketplace_fee := calculate_marketplace_fee(sale_price);
  RETURN sale_price - marketplace_fee;
END;
$$;