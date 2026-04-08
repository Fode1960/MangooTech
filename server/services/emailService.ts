import nodemailer from 'nodemailer';
import { supabase } from '../config/supabase';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface PaymentEmailData {
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  packName?: string;
  packPrice?: number;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configuration pour différents services d'email
    const configs: { [key: string]: EmailConfig } = {
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER || '',
          pass: process.env.GMAIL_PASS || ''
        }
      },
      sendgrid: {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY || ''
        }
      },
      mailgun: {
        host: 'smtp.mailgun.org',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAILGUN_USER || '',
          pass: process.env.MAILGUN_PASS || ''
        }
      }
    };

    // Utiliser la configuration par défaut ou Gmail si disponible
    const emailService = process.env.EMAIL_SERVICE || 'gmail';
    const config = configs[emailService] || configs.gmail;

    if (config.auth.user && config.auth.pass) {
      this.transporter = nodemailer.createTransport(config);
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.transporter) {
      console.log('Service d\'email non configuré - email non envoyé');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@mangootech.com',
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`Email envoyé avec succès à ${emailData.to}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      return false;
    }
  }

  async getUserEmail(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération de l\'email utilisateur:', error);
        return null;
      }

      return data?.email || null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'email utilisateur:', error);
      return null;
    }
  }

  generatePaymentConfirmationEmail(data: PaymentEmailData): { subject: string; html: string } {
    const subject = `✅ Paiement confirmé - ${data.amount} ${data.currency}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirmation de Paiement</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -30px -30px 30px -30px; }
          .content { margin: 20px 0; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-item { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-item:last-child { border-bottom: none; font-weight: bold; color: #28a745; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .highlight { background: #e8f5e8; padding: 15px; border-radius: 5px; border-left: 4px solid #28a745; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Paiement Confirmé !</h1>
            <p>Votre paiement a été traité avec succès</p>
          </div>
          
          <div class="content">
            <div class="highlight">
              <strong>Félicitations !</strong> Votre paiement de <strong>${data.amount} ${data.currency}</strong> a été confirmé avec succès.
            </div>
            
            <p>Bonjour,</p>
            <p>Nous vous confirmons que votre paiement a été traité avec succès. Voici les détails de votre transaction :</p>
            
            <div class="details">
              <div class="detail-item">
                <span>Montant :</span>
                <span>${data.amount} ${data.currency}</span>
              </div>
              <div class="detail-item">
                <span>Méthode de paiement :</span>
                <span>${this.formatPaymentMethod(data.paymentMethod)}</span>
              </div>
              ${data.packName ? `
              <div class="detail-item">
                <span>Pack/Service :</span>
                <span>${data.packName}</span>
              </div>
              ` : ''}
              <div class="detail-item">
                <span>ID de transaction :</span>
                <span>${data.transactionId}</span>
              </div>
              <div class="detail-item">
                <span>Statut :</span>
                <span style="color: #28a745;">✅ Confirmé</span>
              </div>
            </div>
            
            <p>Votre commande sera traitée dans les plus brefs délais. Vous recevrez une notification lorsque votre service sera activé.</p>
            
            <div style="text-align: center;">
              <a href="#" class="button">Consulter mon compte</a>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à contacter notre support client.</p>
            
            <p>Merci de votre confiance !</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p><strong>MangooTech</strong> - Votre plateforme de confiance</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  generatePaymentFailureEmail(data: PaymentEmailData): { subject: string; html: string } {
    const subject = `❌ Échec du paiement - ${data.amount} ${data.currency}`;
    
    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Échec du Paiement</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center; margin: -30px -30px 30px -30px; }
          .content { margin: 20px 0; }
          .details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-item { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-item:last-child { border-bottom: none; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Paiement Échoué</h1>
            <p>Nous n'avons pas pu traiter votre paiement</p>
          </div>
          
          <div class="content">
            <div class="warning">
              <strong>Désolé !</strong> Votre paiement de <strong>${data.amount} ${data.currency}</strong> n'a pas pu être traité.
            </div>
            
            <p>Bonjour,</p>
            <p>Nous regrettons de vous informer que votre paiement n'a pas pu être traité. Voici les détails :</p>
            
            <div class="details">
              <div class="detail-item">
                <span>Montant :</span>
                <span>${data.amount} ${data.currency}</span>
              </div>
              <div class="detail-item">
                <span>Méthode de paiement :</span>
                <span>${this.formatPaymentMethod(data.paymentMethod)}</span>
              </div>
              <div class="detail-item">
                <span>ID de transaction :</span>
                <span>${data.transactionId}</span>
              </div>
              <div class="detail-item">
                <span>Statut :</span>
                <span style="color: #dc3545;">❌ Échoué</span>
              </div>
            </div>
            
            <p><strong>Causes possibles :</strong></p>
            <ul>
              <li>Fonds insuffisants</li>
              <li>Carte expirée</li>
              <li>Problème de connexion avec le service de paiement</li>
              <li>Informations de paiement incorrectes</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="#" class="button">Réessayer le paiement</a>
            </div>
            
            <p>Si le problème persiste, n'hésitez pas à contacter notre support client.</p>
            
            <p>Nous nous excusons pour la gêne occasionnée.</p>
          </div>
          
          <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p><strong>MangooTech</strong> - Votre plateforme de confiance</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  private formatPaymentMethod(method: string): string {
    const methods: { [key: string]: string } = {
      'orange_money': 'Orange Money',
      'mtn_momo': 'MTN Mobile Money',
      'moov_money': 'Moov Money',
      'paypal': 'PayPal',
      'stripe': 'Stripe (Carte bancaire)',
      'card': 'Carte bancaire'
    };
    
    return methods[method] || method;
  }

  async sendPaymentConfirmation(userId: string, paymentData: PaymentEmailData): Promise<boolean> {
    const email = await this.getUserEmail(userId);
    if (!email) {
      console.error('Email utilisateur non trouvé');
      return false;
    }

    const { subject, html } = this.generatePaymentConfirmationEmail(paymentData);
    
    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  async sendPaymentFailure(userId: string, paymentData: PaymentEmailData): Promise<boolean> {
    const email = await this.getUserEmail(userId);
    if (!email) {
      console.error('Email utilisateur non trouvé');
      return false;
    }

    const { subject, html } = this.generatePaymentFailureEmail(paymentData);
    
    return await this.sendEmail({
      to: email,
      subject,
      html
    });
  }
}

export const emailService = new EmailService();
export default emailService;