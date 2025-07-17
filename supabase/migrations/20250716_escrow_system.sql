/*
  # Escrow System for Domain Marketplace

  1. New Tables
    - `escrow_transactions` - Core escrow transaction management
    - `escrow_payments` - Payment tracking and Stripe integration
    - `escrow_disputes` - Dispute resolution system
    - `escrow_messages` - Communication between parties

  2. Security
    - Enable RLS on all tables
    - Add policies for buyer/seller access
    - Admin override capabilities

  3. Features
    - Multi-step escrow process
    - Automated status updates
    - Dispute resolution workflow
    - Payment integration with Stripe
*/

-- Create escrow transactions table
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  marketplace_fee numeric NOT NULL DEFAULT 0 CHECK (marketplace_fee >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Initial state, waiting for buyer funding
    'funded',       -- Buyer has deposited funds
    'transferred',  -- Domain ownership transferred
    'released',     -- Funds released to seller
    'disputed',     -- Dispute raised
    'cancelled',    -- Transaction cancelled
    'refunded'      -- Funds refunded to buyer
  )),
  terms_accepted_buyer boolean DEFAULT false,
  terms_accepted_seller boolean DEFAULT false,
  domain_transfer_code text,
  domain_transfer_confirmed boolean DEFAULT false,
  expected_completion_date timestamptz,
  actual_completion_date timestamptz,
  dispute_reason text,
  dispute_raised_by uuid REFERENCES auth.users(id),
  dispute_raised_at timestamptz,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create escrow payments table for Stripe integration
CREATE TABLE IF NOT EXISTS escrow_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE,
  stripe_charge_id text,
  stripe_transfer_id text,
  payment_type text NOT NULL CHECK (payment_type IN ('deposit', 'release', 'refund')),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'cancelled'
  )),
  failure_reason text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create escrow disputes table
CREATE TABLE IF NOT EXISTS escrow_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL REFERENCES auth.users(id),
  dispute_type text NOT NULL CHECK (dispute_type IN (
    'domain_not_transferred',
    'domain_not_as_described',
    'payment_not_received',
    'technical_issue',
    'other'
  )),
  description text NOT NULL,
  evidence_urls text[],
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  resolution text,
  resolved_by uuid REFERENCES auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create escrow messages table for communication
CREATE TABLE IF NOT EXISTS escrow_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message_type text NOT NULL DEFAULT 'general' CHECK (message_type IN (
    'general',
    'system',
    'dispute',
    'admin'
  )),
  subject text,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_messages ENABLE ROW LEVEL SECURITY;

-- Escrow transactions policies
CREATE POLICY "Users can view their escrow transactions"
  ON escrow_transactions
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Buyers can create escrow transactions"
  ON escrow_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Parties can update their escrow transactions"
  ON escrow_transactions
  FOR UPDATE
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Admins can manage all escrow transactions"
  ON escrow_transactions
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Escrow payments policies
CREATE POLICY "Users can view their payments"
  ON escrow_payments
  FOR SELECT
  TO authenticated
  USING (
    escrow_transaction_id IN (
      SELECT id FROM escrow_transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "System can manage payments"
  ON escrow_payments
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Escrow disputes policies
CREATE POLICY "Parties can view disputes for their transactions"
  ON escrow_disputes
  FOR SELECT
  TO authenticated
  USING (
    escrow_transaction_id IN (
      SELECT id FROM escrow_transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Parties can create disputes"
  ON escrow_disputes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    raised_by = auth.uid() AND
    escrow_transaction_id IN (
      SELECT id FROM escrow_transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all disputes"
  ON escrow_disputes
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Escrow messages policies
CREATE POLICY "Parties can view messages for their transactions"
  ON escrow_messages
  FOR SELECT
  TO authenticated
  USING (
    escrow_transaction_id IN (
      SELECT id FROM escrow_transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Parties can send messages"
  ON escrow_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    escrow_transaction_id IN (
      SELECT id FROM escrow_transactions 
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages"
  ON escrow_messages
  FOR UPDATE
  TO authenticated
  USING (sender_id = auth.uid());

-- Create updated_at triggers
CREATE TRIGGER update_escrow_transactions_updated_at
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_disputes_updated_at
  BEFORE UPDATE ON escrow_disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_buyer_id ON escrow_transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_seller_id ON escrow_transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_domain_id ON escrow_transactions(domain_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_transaction_id ON escrow_payments(escrow_transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_payments_stripe_payment_intent ON escrow_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_escrow_disputes_transaction_id ON escrow_disputes(escrow_transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_disputes_status ON escrow_disputes(status);
CREATE INDEX IF NOT EXISTS idx_escrow_messages_transaction_id ON escrow_messages(escrow_transaction_id);
CREATE INDEX IF NOT EXISTS idx_escrow_messages_sender_id ON escrow_messages(sender_id);

-- Function to calculate marketplace fee (1% of transaction amount)
CREATE OR REPLACE FUNCTION calculate_escrow_marketplace_fee(transaction_amount numeric)
RETURNS numeric
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN ROUND(transaction_amount * 0.01, 2);
END;
$$;

-- Function to automatically update escrow transaction status
CREATE OR REPLACE FUNCTION update_escrow_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Auto-calculate marketplace fee if not set
  IF NEW.marketplace_fee = 0 THEN
    NEW.marketplace_fee := calculate_escrow_marketplace_fee(NEW.amount);
  END IF;

  -- Set expected completion date (7 days from funding)
  IF NEW.status = 'funded' AND OLD.status = 'pending' THEN
    NEW.expected_completion_date := now() + interval '7 days';
  END IF;

  -- Set actual completion date when released
  IF NEW.status = 'released' AND OLD.status != 'released' THEN
    NEW.actual_completion_date := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for automatic status updates
CREATE TRIGGER escrow_status_update_trigger
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_escrow_status();

-- Function to create system messages for status changes
CREATE OR REPLACE FUNCTION create_escrow_system_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create system message for status changes
  IF NEW.status != OLD.status THEN
    INSERT INTO escrow_messages (
      escrow_transaction_id,
      sender_id,
      message_type,
      subject,
      content
    ) VALUES (
      NEW.id,
      NEW.buyer_id, -- System messages from buyer perspective
      'system',
      'Transaction Status Update',
      'Transaction status changed from ' || OLD.status || ' to ' || NEW.status
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for system messages
CREATE TRIGGER escrow_system_message_trigger
  AFTER UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_escrow_system_message();

-- Insert sample escrow transaction for testing (optional)
-- This would be created through the application, not in migration