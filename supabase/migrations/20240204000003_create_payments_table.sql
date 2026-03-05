-- Migration pour créer la table payments manquante
-- Date: 2024-02-04
-- Description: Création de la table payments pour les paiements mobiles et autres méthodes

-- Créer la table payments avec structure complète
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount INTEGER NOT NULL, -- Montant en centimes
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    payment_method VARCHAR(50) NOT NULL, -- 'orange_money', 'mtn_momo', 'moov_money', 'paypal', 'stripe'
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled', 'refunded'
    transaction_id VARCHAR(255), -- ID de transaction de l'opérateur mobile
    paypal_order_id VARCHAR(255), -- ID de commande PayPal
    stripe_payment_intent_id VARCHAR(255), -- ID d'intent Stripe
    phone_number VARCHAR(50), -- Numéro de téléphone pour mobile money
    processing_fee INTEGER DEFAULT 0, -- Frais de traitement en centimes
    net_amount INTEGER DEFAULT 0, -- Montant net après frais
    pack_id UUID, -- ID du pack acheté (si applicable)
    pack_name VARCHAR(255), -- Nom du pack
    pack_price INTEGER, -- Prix du pack
    metadata JSONB DEFAULT '{}', -- Métadonnées supplémentaires
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer la table transactions si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    payment_id UUID REFERENCES public.payments(id),
    type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'subscription'
    amount INTEGER NOT NULL, -- Montant en centimes
    currency VARCHAR(3) NOT NULL DEFAULT 'XOF',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    description TEXT,
    reference VARCHAR(255), -- Référence externe
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des indexes pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON public.transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- Activer RLS (Row Level Security)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Créer des politiques de sécurité
-- Politiques pour la table payments
CREATE POLICY "Les utilisateurs peuvent voir leurs propres paiements" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres paiements" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres paiements" ON public.payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour la table transactions
CREATE POLICY "Les utilisateurs peuvent voir leurs propres transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs propres transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Accès anonyme pour les tests (à restreindre en production)
CREATE POLICY "Accès anonyme pour tests" ON public.payments
    FOR ALL USING (true);

CREATE POLICY "Accès anonyme pour tests transactions" ON public.transactions
    FOR ALL USING (true);

-- Accorder les permissions
GRANT ALL ON public.payments TO anon;
GRANT ALL ON public.payments TO authenticated;
GRANT ALL ON public.transactions TO anon;
GRANT ALL ON public.transactions TO authenticated;

-- Fonction pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer les triggers pour updated_at
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion de données de test
INSERT INTO public.payments (user_id, amount, currency, payment_method, status, transaction_id, phone_number, processing_fee, net_amount, metadata) VALUES
    (gen_random_uuid(), 10000, 'XOF', 'orange_money', 'completed', 'TEST001', '+22670123456', 150, 9850, '{"test": true, "operator": "Orange"}'),
    (gen_random_uuid(), 15000, 'XOF', 'mtn_momo', 'completed', 'TEST002', '+22670123457', 300, 14700, '{"test": true, "operator": "MTN"}'),
    (gen_random_uuid(), 20000, 'XOF', 'moov_money', 'completed', 'TEST003', '+22670123458', 200, 19800, '{"test": true, "operator": "Moov"}');