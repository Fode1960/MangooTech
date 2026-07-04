import express from 'express';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Configuration des notifications
const NOTIFICATION_CONFIG = {
  email: {
    enabled: true,
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    from: process.env.EMAIL_FROM || 'noreply@mangootech.com'
  }
};

// Types de notifications
const NOTIFICATION_TYPES = {
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_PENDING: 'payment_pending',
  COMMISSION_PAID: 'commission_paid'
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return String(error || 'Erreur inconnue');
};

// Middleware d'authentification
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

// Configuration du transporteur email
const createEmailTransporter = () => {
  const smtpUser = String(NOTIFICATION_CONFIG.email.smtp.auth.user || '').trim();
  const smtpPass = String(NOTIFICATION_CONFIG.email.smtp.auth.pass || '').trim();
  const smtpHost = String(NOTIFICATION_CONFIG.email.smtp.host || '').trim();
  const smtpPort = Number(NOTIFICATION_CONFIG.email.smtp.port || 0) || 587;

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('Configuration SMTP incomplète: SMTP_HOST, SMTP_USER et SMTP_PASS sont requis.');
  }

  return nodemailer.createTransport({
    ...NOTIFICATION_CONFIG.email.smtp,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Fonction pour envoyer un email
const sendEmail = async (to: string, subject: string, html: string, text?: string) => {
  try {
    if (!NOTIFICATION_CONFIG.email.enabled) {
      console.log('Email notifications désactivées');
      return { success: false, error: 'Email notifications désactivées' };
    }

    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: NOTIFICATION_CONFIG.email.from,
      to: to,
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, '')
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`Email envoyé à ${to}:`, result.messageId);
    
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

// Fonction pour envoyer une notification de paiement
export const sendPaymentNotification = async (userId: string, paymentData: any) => {
  try {
    // Récupérer les informations de l'utilisateur
    const { data: user } = await supabase
      .from('users')
      .select('email, full_name, notification_preferences')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error(`Utilisateur ${userId} non trouvé`);
      return { success: false, error: 'Utilisateur non trouvé' };
    }

    const { transaction_id, amount, currency, status, payment_method, description } = paymentData;

    let subject = '';
    let html = '';
    let type = '';

    switch (status) {
      case 'succeeded':
        subject = `✅ Paiement réussi - ${amount} ${currency}`;
        type = NOTIFICATION_TYPES.PAYMENT_SUCCESS;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Paiement réussi !</h2>
            <p>Bonjour ${user.full_name},</p>
            <p>Votre paiement de <strong>${amount} ${currency}</strong> a été traité avec succès.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Détails du paiement :</h3>
              <p><strong>Transaction ID:</strong> ${transaction_id}</p>
              <p><strong>Montant:</strong> ${amount} ${currency}</p>
              <p><strong>Méthode:</strong> ${payment_method}</p>
              <p><strong>Description:</strong> ${description || 'Achat en ligne'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            </div>
            <p>Merci de votre confiance !</p>
            <p>L'équipe MangooTech</p>
          </div>
        `;
        break;

      case 'failed':
        subject = `❌ Échec du paiement - ${amount} ${currency}`;
        type = NOTIFICATION_TYPES.PAYMENT_FAILED;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Échec du paiement</h2>
            <p>Bonjour ${user.full_name},</p>
            <p>Nous regrettons de vous informer que votre paiement de <strong>${amount} ${currency}</strong> a échoué.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Détails du paiement :</h3>
              <p><strong>Transaction ID:</strong> ${transaction_id}</p>
              <p><strong>Montant:</strong> ${amount} ${currency}</p>
              <p><strong>Méthode:</strong> ${payment_method}</p>
              <p><strong>Description:</strong> ${description || 'Achat en ligne'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            </div>
            <p>Veuillez réessayer ou contacter notre support si le problème persiste.</p>
            <p>L'équipe MangooTech</p>
          </div>
        `;
        break;

      case 'pending':
        subject = `⏳ Paiement en attente - ${amount} ${currency}`;
        type = NOTIFICATION_TYPES.PAYMENT_PENDING;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ffc107;">Paiement en attente</h2>
            <p>Bonjour ${user.full_name},</p>
            <p>Votre paiement de <strong>${amount} ${currency}</strong> est en cours de traitement.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3>Détails du paiement :</h3>
              <p><strong>Transaction ID:</strong> ${transaction_id}</p>
              <p><strong>Montant:</strong> ${amount} ${currency}</p>
              <p><strong>Méthode:</strong> ${payment_method}</p>
              <p><strong>Description:</strong> ${description || 'Achat en ligne'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
            </div>
            <p>Vous recevrez une notification dès que le paiement sera confirmé.</p>
            <p>L'équipe MangooTech</p>
          </div>
        `;
        break;

      default:
        return { success: false, error: 'Statut de paiement non reconnu' };
    }

    // Enregistrer la notification dans la base de données
    const { data: notification, error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        title: subject,
        content: html,
        metadata: paymentData,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) {
      console.error('Erreur enregistrement notification:', dbError);
    }

    // Envoyer l'email si l'utilisateur l'a activé
    const preferences = user.notification_preferences || {};
    let emailResult: Awaited<ReturnType<typeof sendEmail>> | null = null;
    if (preferences.email !== false) {
      emailResult = await sendEmail(user.email, subject, html);
      
      // Mettre à jour la notification avec le résultat de l'email
      if (notification) {
        await supabase
          .from('notifications')
          .update({
            email_sent: emailResult.success,
            email_error: emailResult.error || null,
            email_sent_at: emailResult.success ? new Date().toISOString() : null
          })
          .eq('id', notification.id);
      }
    }

    return { 
      success: true, 
      notification_id: notification?.id,
      email_sent: emailResult?.success || false
    };
  } catch (error) {
    console.error('Erreur notification paiement:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

// Fonction pour envoyer une notification de commission
export const sendCommissionNotification = async (shopId: string, commissionData: any) => {
  try {
    // Récupérer le propriétaire de la boutique
    const { data: shop } = await supabase
      .from('shops')
      .select('owner_id, name')
      .eq('id', shopId)
      .single();

    if (!shop) {
      return { success: false, error: 'Boutique non trouvée' };
    }

    const { data: owner } = await supabase
      .from('users')
      .select('email, full_name, notification_preferences')
      .eq('id', shop.owner_id)
      .single();

    if (!owner) {
      return { success: false, error: 'Propriétaire non trouvé' };
    }

    const { amount, currency, transaction_id, period } = commissionData;
    const subject = `💰 Commission versée - ${amount} ${currency}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Commission versée !</h2>
        <p>Bonjour ${owner.full_name},</p>
        <p>Une commission de <strong>${amount} ${currency}</strong> a été versée pour votre boutique <strong>${shop.name}</strong>.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Détails de la commission :</h3>
          <p><strong>Transaction ID:</strong> ${transaction_id}</p>
          <p><strong>Montant:</strong> ${amount} ${currency}</p>
          <p><strong>Période:</strong> ${period || 'Non spécifiée'}</p>
          <p><strong>Date de versement:</strong> ${new Date().toLocaleString('fr-FR')}</p>
        </div>
        <p>Merci pour votre confiance !</p>
        <p>L'équipe MangooTech</p>
      </div>
    `;

    // Enregistrer la notification
    const { data: notification } = await supabase
      .from('notifications')
      .insert({
        user_id: shop.owner_id,
        type: NOTIFICATION_TYPES.COMMISSION_PAID,
        title: subject,
        content: html,
        metadata: commissionData,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Envoyer l'email
    const preferences = owner.notification_preferences || {};
    let emailResult: Awaited<ReturnType<typeof sendEmail>> | null = null;
    if (preferences.email !== false) {
      emailResult = await sendEmail(owner.email, subject, html);
      
      if (notification) {
        await supabase
          .from('notifications')
          .update({
            email_sent: emailResult.success,
            email_error: emailResult.error || null,
            email_sent_at: emailResult.success ? new Date().toISOString() : null
          })
          .eq('id', notification.id);
      }
    }

    return { 
      success: true, 
      notification_id: notification?.id,
      email_sent: emailResult?.success || false
    };
  } catch (error) {
    console.error('Erreur notification commission:', error);
    return { success: false, error: getErrorMessage(error) };
  }
};

// === ROUTES POUR LA GESTION DES NOTIFICATIONS ===

// Obtenir les préférences de notification d'un utilisateur
router.get('/preferences/:userId',
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      
      const { data: user } = await supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'Utilisateur non trouvé' 
        });
      }

      res.json({
        success: true,
        data: user.notification_preferences || {
          email: true,
          sms: false,
          push: true,
          payment_success: true,
          payment_failed: true,
          payment_pending: false,
          commission_paid: true
        }
      });
    } catch (error) {
      console.error('Erreur récupération préférences:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Mettre à jour les préférences de notification
router.put('/preferences/:userId',
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      const preferences = req.body;

      const { data: user, error } = await supabase
        .from('users')
        .update({
          notification_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: user.notification_preferences,
        message: 'Préférences mises à jour avec succès'
      });
    } catch (error) {
      console.error('Erreur mise à jour préférences:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir les notifications d'un utilisateur
router.get('/user/:userId',
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, unread_only = false } = req.query as any;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unread_only === 'true') {
        query = query.eq('read', false);
      }

      const offset = (parseInt(page) - 1) * parseInt(limit);
      query = query.range(offset, offset + parseInt(limit) - 1);

      const { data: notifications, count, error } = await query;

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: {
          notifications: notifications || [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count || 0,
            total_pages: Math.ceil((count || 0) / parseInt(limit))
          },
          unread_count: notifications?.filter(n => !n.read).length || 0
        }
      });
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Marquer une notification comme lue
router.put('/read/:notificationId',
  async (req: express.Request, res: express.Response) => {
    try {
      const { notificationId } = req.params;

      const { data: notification, error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification marquée comme lue'
      });
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Marquer toutes les notifications comme lues
router.put('/read-all/:userId',
  async (req: express.Request, res: express.Response) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .update({
          read: true,
          read_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        throw error;
      }

      const updatedCount = Array.isArray(data) ? (data as unknown[]).length : 0;

      res.json({
        success: true,
        data: { updated_count: updatedCount },
        message: 'Toutes les notifications ont été marquées comme lues'
      });
    } catch (error) {
      console.error('Erreur marquage notifications:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Envoyer une notification personnalisée (admin)
router.post('/send',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { user_id, title, content, type = 'custom', metadata = {} } = req.body;

      // Récupérer l'utilisateur
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name, notification_preferences')
        .eq('id', user_id)
        .single();

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          error: 'Utilisateur non trouvé' 
        });
      }

      // Créer la notification
      const { data: notification, error: dbError } = await supabase
        .from('notifications')
        .insert({
          user_id: user_id,
          type: type,
          title: title,
          content: content,
          metadata: metadata,
          read: false,
          created_at: new Date().toISOString(),
          sent_by: (req as any).user.id
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Envoyer l'email si activé
      const preferences = user.notification_preferences || {};
      if (preferences.email !== false) {
        const emailResult = await sendEmail(user.email, title, content);
        
        await supabase
          .from('notifications')
          .update({
            email_sent: emailResult.success,
            email_error: emailResult.error || null,
            email_sent_at: emailResult.success ? new Date().toISOString() : null
          })
          .eq('id', notification.id);
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification envoyée avec succès'
      });
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

// Obtenir les statistiques de notification (admin)
router.get('/stats',
  authenticateAdmin,
  async (req: express.Request, res: express.Response) => {
    try {
      const { start_date, end_date } = req.query as any;

      let query = supabase
        .from('notifications')
        .select('type, read, email_sent, created_at');

      if (start_date) {
        query = query.gte('created_at', start_date);
      }
      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      const { data: notifications, error } = await query;

      if (error) {
        throw error;
      }

      // Calculer les statistiques
      const stats = {
        total: notifications?.length || 0,
        read: notifications?.filter(n => n.read).length || 0,
        unread: notifications?.filter(n => !n.read).length || 0,
        email_sent: notifications?.filter(n => n.email_sent).length || 0,
        email_failed: notifications?.filter(n => n.email_sent === false).length || 0,
        by_type: {}
      };

      // Statistiques par type
      notifications?.forEach(notification => {
        if (!stats.by_type[notification.type]) {
          stats.by_type[notification.type] = {
            total: 0,
            read: 0,
            email_sent: 0
          };
        }
        stats.by_type[notification.type].total++;
        if (notification.read) stats.by_type[notification.type].read++;
        if (notification.email_sent) stats.by_type[notification.type].email_sent++;
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Erreur statistiques notifications:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erreur serveur' 
      });
    }
  }
);

export default router;
