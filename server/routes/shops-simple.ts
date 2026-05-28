import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Route simple pour récupérer toutes les boutiques (sans authentification)
router.get('/shops/simple', async (req, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération boutiques:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Erreur lors de la récupération des boutiques' 
      });
    }

    res.json({
      success: true,
      data: shops || [],
      count: shops?.length || 0
    });
  } catch (error) {
    console.error('Erreur générale:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur' 
    });
  }
});

export default router;