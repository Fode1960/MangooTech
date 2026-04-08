import express from 'express';

const router = express.Router();

// Données mock pour le tableau de bord analytics (à remplacer par les vraies données Supabase)
const mockAnalyticsData = {
  totalRevenue: 125430.50,
  totalTransactions: 342,
  activeUsers: 156,
  packsSold: 89,
  conversionRate: 23.5,
  revenueTrend: [
    { date: '2024-01-01', revenue: 1200 },
    { date: '2024-01-02', revenue: 1850 },
    { date: '2024-01-03', revenue: 2100 },
    { date: '2024-01-04', revenue: 1750 },
    { date: '2024-01-05', revenue: 2300 },
    { date: '2024-01-06', revenue: 2800 },
    { date: '2024-01-07', revenue: 3200 }
  ],
  paymentMethodDistribution: [
    { name: 'Orange Money', value: 35 },
    { name: 'MTN Money', value: 28 },
    { name: 'Moov Money', value: 15 },
    { name: 'PayPal', value: 12 },
    { name: 'Stripe', value: 10 }
  ],
  topUsers: [
    { id: 1, name: 'Jean Dupont', email: 'jean@example.com', totalSpent: 1250.00, transactionCount: 15 },
    { id: 2, name: 'Marie Martin', email: 'marie@example.com', totalSpent: 980.50, transactionCount: 12 },
    { id: 3, name: 'Pierre Bernard', email: 'pierre@example.com', totalSpent: 750.25, transactionCount: 8 }
  ]
};

/**
 * Obtenir les statistiques générales des paiements
 */
router.get('/stats', async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      currency = 'all', 
      paymentMethod = 'all',
      userId,
      range = '30d'
    } = req.query;

    console.log(`Analytics request - Range: ${range}, Currency: ${currency}, Method: ${paymentMethod}`);
    
    // Simuler un délai de chargement
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return res.json({
      success: true,
      data: mockAnalyticsData
    });

  } catch (error) {
    console.error('Erreur dans /api/analytics/stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
});

/**
 * Obtenir les tendances de paiement par date
 */
router.get('/trends', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Données mock pour les tendances
    const mockTrends = [
      { date: '2024-01-01', payments: 45, amount: 1250 },
      { date: '2024-01-02', payments: 52, amount: 1890 },
      { date: '2024-01-03', payments: 38, amount: 1420 },
      { date: '2024-01-04', payments: 61, amount: 2340 },
      { date: '2024-01-05', payments: 47, amount: 1750 },
      { date: '2024-01-06', payments: 55, amount: 2100 },
      { date: '2024-01-07', payments: 43, amount: 1680 }
    ];

    return res.json({
      success: true,
      data: mockTrends
    });

  } catch (error) {
    console.error('Erreur dans /api/analytics/trends:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des tendances'
    });
  }
});

/**
 * Obtenir les meilleurs utilisateurs par dépenses
 */
router.get('/top-users', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Données mock pour les meilleurs utilisateurs
    const mockTopUsers = [
      { id: 1, name: 'Jean Dupont', email: 'jean@example.com', totalSpent: 1250.00, transactionCount: 15, avatar: '👨‍💼' },
      { id: 2, name: 'Marie Martin', email: 'marie@example.com', totalSpent: 980.50, transactionCount: 12, avatar: '👩‍💻' },
      { id: 3, name: 'Pierre Bernard', email: 'pierre@example.com', totalSpent: 750.25, transactionCount: 8, avatar: '👨‍🎨' },
      { id: 4, name: 'Sophie Laurent', email: 'sophie@example.com', totalSpent: 650.00, transactionCount: 7, avatar: '👩‍🔬' },
      { id: 5, name: 'Thomas Moreau', email: 'thomas@example.com', totalSpent: 520.75, transactionCount: 6, avatar: '👨‍💻' }
    ];

    return res.json({
      success: true,
      data: mockTopUsers.slice(0, parseInt(limit as string))
    });

  } catch (error) {
    console.error('Erreur dans /api/analytics/top-users:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des utilisateurs'
    });
  }
});

/**
 * Obtenir les statistiques par méthode de paiement
 */
router.get('/payment-methods', async (req, res) => {
  try {
    // Données mock pour la répartition par méthode de paiement
    const mockPaymentMethods = [
      { method: 'Orange Money', count: 125, amount: 15620.50, percentage: 35 },
      { method: 'MTN Money', count: 98, amount: 12340.25, percentage: 28 },
      { method: 'Moov Money', count: 67, amount: 8420.75, percentage: 15 },
      { method: 'PayPal', count: 45, amount: 6780.00, percentage: 12 },
      { method: 'Stripe', count: 38, amount: 5230.00, percentage: 10 }
    ];

    return res.json({
      success: true,
      data: mockPaymentMethods
    });

  } catch (error) {
    console.error('Erreur dans /api/analytics/payment-methods:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la récupération des méthodes de paiement'
    });
  }
});

export default router;