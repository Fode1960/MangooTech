import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Configuration Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key', {
  apiVersion: '2024-06-20',
});

// Configuration PayPal (à implémenter plus tard)
const PAYPAL_CONFIG = {
  clientId: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
  clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'your_paypal_client_secret',
  environment: process.env.NODE_ENV === 'production' ? 'live' : 'sandbox',
};

// Configuration des paiements mobiles africains
const MOBILE_MONEY_CONFIG = {
  orange_money: {
    apiKey: process.env.ORANGE_MONEY_API_KEY,
    merchantCode: process.env.ORANGE_MONEY_MERCHANT_CODE,
    currency: 'XOF',
    countries: ['CI', 'SN', 'ML', 'BF'],
  },
  mtn_momo: {
    apiKey: process.env.MTN_MOMO_API_KEY,
    merchantCode: process.env.MTN_MOMO_MERCHANT_CODE,
    currency: 'XOF',
    countries: ['CI', 'GH', 'UG', 'RW'],
  },
  moov_money: {
    apiKey: process.env.MOOV_MONEY_API_KEY,
    merchantCode: process.env.MOOV_MONEY_MERCHANT_CODE,
    currency: 'XOF',
    countries: ['CI', 'TG', 'BJ'],
  },
};

export { stripe, PAYPAL_CONFIG, MOBILE_MONEY_CONFIG };