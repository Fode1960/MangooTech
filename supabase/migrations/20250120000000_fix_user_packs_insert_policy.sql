-- Ajouter la politique manquante pour permettre aux utilisateurs de créer leurs propres packs
CREATE POLICY "Users can create their own packs" ON user_packs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);