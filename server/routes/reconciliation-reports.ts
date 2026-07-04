import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Middleware d'authentification admin
const authenticateAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token manquant' 
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token invalide' 
      });
    }

    // Vérifier si l'utilisateur est admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role_id, is_active')
      .eq('user_id', user.id)
      .single();

    if (!adminUser || !adminUser.is_active) {
      return res.status(403).json({ 
        success: false, 
        error: 'Accès refusé: Administrateur requis' 
      });
    }

    (req as any).adminUser = adminUser;
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Erreur authentification admin:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

// Fonction pour générer un rapport de réconciliation
const generateReconciliationReport = async (startDate: Date, endDate: Date) => {
  try {
    // Récupérer toutes les transactions dans la période
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Récupérer les paiements Stripe
    const { data: stripePayments } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Récupérer les commissions
    const { data: commissions } = await supabase
      .from('commissions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Calculer les totaux par méthode de paiement
    const totalsByMethod = transactions?.reduce((acc, transaction) => {
      const method = transaction.payment_method;
      if (!acc[method]) {
        acc[method] = {
          total_amount: 0,
          successful_amount: 0,
          failed_amount: 0,
          pending_amount: 0,
          transaction_count: 0,
          successful_count: 0,
          failed_count: 0,
          pending_count: 0
        };
      }

      const amount = parseFloat(transaction.amount || 0);
      acc[method].total_amount += amount;
      acc[method].transaction_count++;

      if (transaction.status === 'succeeded') {
        acc[method].successful_amount += amount;
        acc[method].successful_count++;
      } else if (transaction.status === 'failed') {
        acc[method].failed_amount += amount;
        acc[method].failed_count++;
      } else if (transaction.status === 'pending') {
        acc[method].pending_amount += amount;
        acc[method].pending_count++;
      }

      return acc;
    }, {} as Record<string, any>) || {};

    // Calculer les totaux généraux
    const totals = {
      total_transactions: transactions?.length || 0,
      total_amount: transactions?.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
      successful_transactions: transactions?.filter(t => t.status === 'succeeded').length || 0,
      successful_amount: transactions?.filter(t => t.status === 'succeeded').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
      failed_transactions: transactions?.filter(t => t.status === 'failed').length || 0,
      failed_amount: transactions?.filter(t => t.status === 'failed').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0,
      pending_transactions: transactions?.filter(t => t.status === 'pending').length || 0,
      pending_amount: transactions?.filter(t => t.status === 'pending').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0
    };

    // Calculer les commissions totales
    const commissionTotals = commissions?.reduce((acc, commission) => {
      return {
        total_commissions: acc.total_commissions + parseFloat(commission.total_commission || 0),
        platform_commissions: acc.platform_commissions + parseFloat(commission.platform_commission || 0),
        payment_fees: acc.payment_fees + parseFloat(commission.payment_processing_fee || 0),
        shop_earnings: acc.shop_earnings + parseFloat(commission.shop_earning || 0)
      };
    }, {
      total_commissions: 0,
      platform_commissions: 0,
      payment_fees: 0,
      shop_earnings: 0
    }) || {
      total_commissions: 0,
      platform_commissions: 0,
      payment_fees: 0,
      shop_earnings: 0
    };

    // Identifier les anomalies
    const anomalies = [];

    // Vérifier les transactions sans commission
    const transactionsWithoutCommission = transactions?.filter(t => 
      t.status === 'succeeded' && !t.commission_amount
    ) || [];

    if (transactionsWithoutCommission.length > 0) {
      anomalies.push({
        type: 'missing_commissions',
        description: `${transactionsWithoutCommission.length} transactions réussies sans commission calculée`,
        count: transactionsWithoutCommission.length,
        total_amount: transactionsWithoutCommission.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
      });
    }

    // Vérifier les écarts entre paiements et transactions
    const stripeTotal = stripePayments?.reduce((sum, p) => {
      if (p.status === 'succeeded') {
        return sum + parseFloat(p.amount || 0);
      }
      return sum;
    }, 0) || 0;

    const transactionStripeTotal = transactions?.filter(t => 
      t.payment_method === 'stripe' && t.status === 'succeeded'
    ).reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;

    if (Math.abs(stripeTotal - transactionStripeTotal) > 0.01) {
      anomalies.push({
        type: 'stripe_discrepancy',
        description: 'Écart entre les totaux Stripe et les transactions',
        stripe_total: stripeTotal,
        transaction_total: transactionStripeTotal,
        difference: Math.abs(stripeTotal - transactionStripeTotal)
      });
    }

    return {
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        },
        totals,
        totals_by_method: totalsByMethod,
        commissions: commissionTotals,
        anomalies,
        summary: {
          total_revenue: totals.successful_amount,
          net_revenue: totals.successful_amount - commissionTotals.total_commissions,
          platform_revenue: commissionTotals.platform_commissions,
          commission_rate: totals.successful_amount > 0 ? 
            ((commissionTotals.total_commissions / totals.successful_amount) * 100).toFixed(2) : 0,
          success_rate: totals.total_transactions > 0 ? 
            ((totals.successful_transactions / totals.total_transactions) * 100).toFixed(2) : 0
        }
      }
    };
  } catch (error) {
    console.error('Erreur génération rapport réconciliation:', error);
    return {
      success: false,
      error: 'Erreur génération rapport'
    };
  }
};

// === ROUTES POUR LA RÉCONCILIATION ET LES RAPPORTS ===

// Générer un rapport de réconciliation
router.post('/reconciliation',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { start_date, end_date, period = '30' } = req.query as any;
      
      let startDate, endDate;
      if (start_date && end_date) {
        startDate = new Date(start_date as string);
        endDate = new Date(end_date as string);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period as string));
      }

      const report = await generateReconciliationReport(startDate, endDate);
      
      if (report.success) {
        // Enregistrer le rapport
        const { data: savedReport, error } = await supabase
          .from('reconciliation_reports')
          .insert({
            report_type: 'reconciliation',
            period_start: startDate.toISOString(),
            period_end: endDate.toISOString(),
            data: report.data,
            generated_by: (req as any).user.id,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        res.json({
          success: true,
          data: {
            ...report.data,
            report_id: savedReport.id
          }
        });
      } else {
        res.status(400).json(report);
      }
    } catch (error) {
      console.error('Erreur rapport réconciliation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir l'historique des rapports
router.get('/reports',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { page = 1, limit = 20, type } = req.query as any;

      let query = supabase
        .from('reconciliation_reports')
        .select(`
          *,
          users!reconciliation_reports_generated_by_fkey(
            email,
            full_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (type) {
        query = query.eq('report_type', type);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data: reports, count, error } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          reports: reports || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            total_pages: Math.ceil((count || 0) / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Erreur historique rapports:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir un rapport spécifique
router.get('/reports/:reportId',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { reportId } = req.params;

      const { data: report, error } = await supabase
        .from('reconciliation_reports')
        .select(`
          *,
          users!reconciliation_reports_generated_by_fkey(
            email,
            full_name
          )
        `)
        .eq('id', reportId)
        .single();

      if (error) {
        throw error;
      }

      if (!report) {
        return res.status(404).json({ 
          success: false, 
          error: 'Rapport non trouvé' 
        });
      }

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Erreur récupération rapport:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Générer un rapport financier détaillé
router.post('/financial',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { start_date, end_date, group_by = 'day' } = req.query as any;
      
      let startDate, endDate;
      if (start_date && end_date) {
        startDate = new Date(start_date as string);
        endDate = new Date(end_date as string);
      } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
      }

      // Récupérer les données financières
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: commissions } = await supabase
        .from('commissions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Grouper les données
      let financialData: Array<{
        date: string;
        revenue: number;
        commissions: number;
        platform_revenue: number;
        transaction_count: number;
        successful_transactions: number;
      }> = [];
      
      if (group_by === 'day') {
        const dailyData: Record<string, {
          date: string;
          revenue: number;
          commissions: number;
          platform_revenue: number;
          transaction_count: number;
          successful_transactions: number;
        }> = {};
        
        // Traiter les transactions
        transactions?.forEach(transaction => {
          const date = new Date(transaction.created_at).toISOString().split('T')[0];
          if (!dailyData[date]) {
            dailyData[date] = {
              date,
              revenue: 0,
              commissions: 0,
              platform_revenue: 0,
              transaction_count: 0,
              successful_transactions: 0
            };
          }
          
          const amount = parseFloat(transaction.amount || 0);
          dailyData[date].transaction_count++;
          
          if (transaction.status === 'succeeded') {
            dailyData[date].revenue += amount;
            dailyData[date].successful_transactions++;
          }
        });

        // Traiter les commissions
        commissions?.forEach(commission => {
          const date = new Date(commission.created_at).toISOString().split('T')[0];
          if (dailyData[date]) {
            dailyData[date].commissions += parseFloat(commission.total_commission || 0);
            dailyData[date].platform_revenue += parseFloat(commission.platform_commission || 0);
          }
        });

        financialData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
      }

      // Calculer les totaux
      const totals = {
        total_revenue: financialData.reduce((sum, day) => sum + day.revenue, 0),
        total_commissions: financialData.reduce((sum, day) => sum + day.commissions, 0),
        total_platform_revenue: financialData.reduce((sum, day) => sum + day.platform_revenue, 0),
        total_transactions: financialData.reduce((sum, day) => sum + day.transaction_count, 0),
        total_successful_transactions: financialData.reduce((sum, day) => sum + day.successful_transactions, 0)
      };

      // Enregistrer le rapport financier
      const { data: savedReport, error } = await supabase
        .from('reconciliation_reports')
        .insert({
          report_type: 'financial',
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString(),
          data: {
            financial_data: financialData,
            totals,
            group_by: group_by
          },
          generated_by: (req as any).user.id,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          financial_data: financialData,
          totals,
          report_id: savedReport.id
        }
      });
    } catch (error) {
      console.error('Erreur rapport financier:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Exporter les données de réconciliation
router.get('/export/:reportId',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { reportId } = req.params;
      const { format = 'csv' } = req.query as any;

      const { data: report, error } = await supabase
        .from('reconciliation_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        throw error;
      }

      if (!report) {
        return res.status(404).json({ 
          success: false, 
          error: 'Rapport non trouvé' 
        });
      }

      const data: any = report.data;

      if (format === 'csv') {
        // Générer CSV
        let csvContent = '';
        
        if (report.report_type === 'reconciliation') {
          csvContent = [
            'Type,Description,Montant,Nombre',
            `Totaux,Revenu total,${data.totals.successful_amount},${data.totals.successful_transactions}`,
            `Totaux,Commissions,${data.commissions.total_commissions},${data.totals.successful_transactions}`,
            `Totaux,Revenu net,${data.summary.net_revenue},${data.totals.successful_transactions}`,
            '',
            'Méthode,Montant total,Montant réussi,Nombre total,Nombre réussi,Taux réussite',
            ...Object.entries(data.totals_by_method as Record<string, any>).map(([method, stats]) => 
              `${method},${stats.total_amount},${stats.successful_amount},${stats.transaction_count},${stats.successful_count},${((stats.successful_count / stats.transaction_count) * 100).toFixed(2)}%`
            )
          ].join('\n');
        } else if (report.report_type === 'financial') {
          csvContent = [
            'Date,Revenu,Commissions,Revenu plateforme,Transactions,Réussites',
            ...data.financial_data.map((day: any) => 
              `${day.date},${day.revenue},${day.commissions},${day.platform_revenue},${day.transaction_count},${day.successful_transactions}`
            )
          ].join('\n');
        }

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${report.report_type}_report_${report.period_start.split('T')[0]}_${report.period_end.split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // JSON
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${report.report_type}_report_${report.period_start.split('T')[0]}_${report.period_end.split('T')[0]}.json"`);
        res.json({
          success: true,
          report: report,
          data: data
        });
      }
    } catch (error) {
      console.error('Erreur export rapport:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir le tableau de bord de réconciliation
router.get('/dashboard',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Statistiques générales
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: commissions } = await supabase
        .from('commissions')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Transactions récentes à vérifier
      const { data: recentTransactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Anomalies détectées
      const anomalies = [];

      // Vérifier les transactions sans commission
      const transactionsWithoutCommission = transactions?.filter(t => 
        t.status === 'succeeded' && !t.commission_amount
      ) || [];

      if (transactionsWithoutCommission.length > 0) {
        anomalies.push({
          type: 'missing_commissions',
          severity: 'high',
          count: transactionsWithoutCommission.length,
          total_amount: transactionsWithoutCommission.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
          description: 'Transactions réussies sans commission calculée'
        });
      }

      // Vérifier les transactions en attente depuis longtemps
      const oldPendingTransactions = transactions?.filter(t => {
        if (t.status === 'pending') {
          const hoursPending = (Date.now() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
          return hoursPending > 24;
        }
        return false;
      }) || [];

      if (oldPendingTransactions.length > 0) {
        anomalies.push({
          type: 'old_pending_transactions',
          severity: 'medium',
          count: oldPendingTransactions.length,
          total_amount: oldPendingTransactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
          description: 'Transactions en attente depuis plus de 24h'
        });
      }

      // Calculer les indicateurs clés
      const totalRevenue = transactions?.filter(t => t.status === 'succeeded').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) || 0;
      const totalCommissions = commissions?.reduce((sum, c) => sum + parseFloat(c.total_commission || 0), 0) || 0;
      const successRate = transactions?.length > 0 ? 
        ((transactions.filter(t => t.status === 'succeeded').length / transactions.length) * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          period: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString()
          },
          overview: {
            total_revenue: totalRevenue,
            total_commissions: totalCommissions,
            net_revenue: totalRevenue - totalCommissions,
            success_rate: Number(successRate),
            total_transactions: transactions?.length || 0,
            pending_transactions: transactions?.filter(t => t.status === 'pending').length || 0
          },
          recent_transactions: recentTransactions || [],
          anomalies: anomalies,
          alerts: {
            critical: anomalies.filter(a => a.severity === 'high').length,
            warning: anomalies.filter(a => a.severity === 'medium').length,
            info: anomalies.filter(a => a.severity === 'low').length
          }
        }
      });
    } catch (error) {
      console.error('Erreur tableau de bord réconciliation:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;
export { generateReconciliationReport };
