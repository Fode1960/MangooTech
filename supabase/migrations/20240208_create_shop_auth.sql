-- Table pour les paramètres d'authentification des boutiques
CREATE TABLE IF NOT EXISTS shop_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  shop_url TEXT NOT NULL UNIQUE,
  vendor_login VARCHAR(100) NOT NULL UNIQUE,
  vendor_password VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_shop_auth_shop_id ON shop_auth(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_auth_vendor_login ON shop_auth(vendor_login);
CREATE INDEX IF NOT EXISTS idx_shop_auth_shop_url ON shop_auth(shop_url);

-- Fonction pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_shop_auth_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour la mise à jour automatique de updated_at
CREATE TRIGGER trigger_update_shop_auth_updated_at
  BEFORE UPDATE ON shop_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_auth_updated_at();

-- RLS Policies
ALTER TABLE shop_auth ENABLE ROW LEVEL SECURITY;

-- Policy pour les vendeurs : peuvent voir/modifier uniquement leurs propres paramètres
CREATE POLICY shop_auth_vendor_policy ON shop_auth
  FOR ALL
  TO authenticated
  USING (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    shop_id IN (
      SELECT id FROM shops WHERE user_id = auth.uid()
    )
  );

-- Policy pour l'admin : peut voir/modifier tous les paramètres
CREATE POLICY shop_auth_admin_policy ON shop_auth
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON shop_auth TO authenticated;
GRANT SELECT ON shop_auth TO anon;