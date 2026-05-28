
-- Table user_credits pour gérer les crédits utilisateur
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_type ON user_credits(type);
CREATE INDEX IF NOT EXISTS idx_user_credits_expires_at ON user_credits(expires_at);

-- Table cancellation_feedback pour les retours d'annulation
CREATE TABLE IF NOT EXISTS cancellation_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id UUID REFERENCES packs(id),
  reason VARCHAR(100),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_user_id ON cancellation_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_pack_id ON cancellation_feedback(pack_id);
CREATE INDEX IF NOT EXISTS idx_cancellation_feedback_reason ON cancellation_feedback(reason);

-- Politiques RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- Politiques pour user_credits
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits" ON user_credits
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage credits" ON user_credits;
CREATE POLICY "Service can manage credits" ON user_credits
  FOR ALL USING (true);

-- Politiques pour cancellation_feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON cancellation_feedback;
CREATE POLICY "Users can insert their own feedback" ON cancellation_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own feedback" ON cancellation_feedback;
CREATE POLICY "Users can view their own feedback" ON cancellation_feedback
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage feedback" ON cancellation_feedback;
CREATE POLICY "Service can manage feedback" ON cancellation_feedback
  FOR ALL USING (true);
