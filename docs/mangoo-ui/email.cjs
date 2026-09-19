#!/usr/bin/env node
/* =========================================================================
   Mangoo Connect+ — envoi d'e-mails transactionnels via Brevo (SMTP)
   -------------------------------------------------------------------------
   Configuration via variables d'environnement (Render) :
     BREVO_SMTP_HOST     ex. smtp-relay.brevo.com
     BREVO_SMTP_PORT     ex. 587 (défaut) ou 465 (SSL)
     BREVO_SMTP_LOGIN    identifiant SMTP Brevo
     BREVO_SMTP_KEY      clé SMTP Brevo (xsmtpsib-…)
     BREVO_FROM_NAME     nom d'affichage de l'expéditeur (défaut : Mangoo)
     BREVO_FROM_EMAIL    adresse de l'expéditeur (défaut : contact@mangoo.tech)

   Chargé de façon défensive : si `nodemailer` ou les variables manquent,
   `isConfigured()` renvoie false et `sendMail()` résout en no-op. Le serveur
   continue de fonctionner (les codes restent renvoyés en `demoCode`).
   ========================================================================= */
'use strict';

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null;
}

let transporter = null;

function envConfigured() {
  return Boolean(
    process.env.BREVO_SMTP_HOST &&
    process.env.BREVO_SMTP_LOGIN &&
    process.env.BREVO_SMTP_KEY
  );
}

function getTransporter() {
  if (transporter) return transporter;
  if (!nodemailer || !envConfigured()) return null;
  try {
    const port = Number(process.env.BREVO_SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.BREVO_SMTP_HOST,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });
  } catch (e) {
    console.warn('[Email] création du transporteur impossible :', e.message);
    transporter = null;
  }
  return transporter;
}

function isConfigured() {
  return Boolean(getTransporter());
}

function sendMail(opts) {
  const t = getTransporter();
  if (!t) {
    return Promise.resolve({ ok: false, error: 'SMTP non configuré (variables BREVO_* absentes ou nodemailer manquant).' });
  }
  opts = opts || {};
  if (!opts.to) {
    return Promise.resolve({ ok: false, error: 'Destinataire manquant.' });
  }
  const fromName = process.env.BREVO_FROM_NAME || 'Mangoo';
  const fromEmail = process.env.BREVO_FROM_EMAIL || 'contact@mangoo.tech';
  const mail = {
    from: '"' + fromName + '" <' + fromEmail + '>',
    to: opts.to,
    subject: opts.subject || 'Mangoo',
    text: opts.text || '',
  };
  if (opts.html) mail.html = opts.html;
  return t.sendMail(mail)
    .then(function (info) { return { ok: true, messageId: info && info.messageId }; })
    .catch(function (err) { return { ok: false, error: err && err.message }; });
}

module.exports = { isConfigured: isConfigured, sendMail: sendMail };
