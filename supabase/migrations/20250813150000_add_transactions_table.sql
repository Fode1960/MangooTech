-- Table pour enregistrer les transactions de paiement
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  stripe_session_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  payment_method VARCHAR(50) DEFAULT 'stripe',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_session ON transactions(stripe_session_id);

-- RLS policies
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can manage all transactions" ON transactions;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view their own transactions" ON transactions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON transactions 
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');