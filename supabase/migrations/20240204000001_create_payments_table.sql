-- Migration : Création de la table payments pour les paiements mobiles et autres méthodes
-- Date : 2024-02-04

-- Créer la table payments
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Montant en centimes
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    payment_method VARCHAR(50) NOT NULL, -- 'orange_money', 'mtn_momo', 'moov_money', 'paypal', 'stripe'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'succeeded', 'failed', 'cancelled'
    
    -- Informations de transaction
    transaction_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    
    -- Détails du paiement
    phone_number VARCHAR(50),
    processing_fee INTEGER DEFAULT 0, -- Frais en centimes
    net_amount INTEGER DEFAULT 0, -- Montant net en centimes
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}',
    
    -- Pack/subscription info (si applicable)
    pack_id UUID,
    pack_name VARCHAR(255),
    pack_price INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index pour les performances
    CONSTRAINT idx_payments_user_id_created_at UNIQUE (user_id, created_at)
);

-- Créer les indexes pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON public.payments(paypal_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON public.payments(stripe_payment_intent_id);

-- Créer une fonction pour mettre à jour le timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.payments TO authenticated;
GRANT SELECT ON public.payments TO anon;

-- Créer la table transactions pour l'historique détaillé
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'chargeback'
    status VARCHAR(50) NOT NULL, -- 'completed', 'pending', 'failed'
    amount INTEGER NOT NULL, -- Montant en centimes
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    
    -- Détails de la transaction
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Informations de l'opérateur mobile money (si applicable)
    operator_response JSONB DEFAULT '{}',
    confirmation_code VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index pour les performances
    CONSTRAINT idx_transactions_payment_user UNIQUE (payment_id, user_id, created_at)
);

-- Créer les indexes pour la table transactions
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON public.transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Grant permissions pour transactions
GRANT ALL ON public.transactions TO authenticated;
GRANT SELECT ON public.transactions TO anon;