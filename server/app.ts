/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth'
import paymentRoutes from './routes/payments'
import stripeWebhookRoutes from './routes/stripe-webhooks'
import stripeSubscriptionRoutes from './routes/stripe-subscriptions'
import paypalRoutes from './routes/paypal-routes'
import analyticsRoutes from './routes/analytics'
import mobileMoneyRoutes from './routes/mobile-money'
import mobileMoneyWebhooksRoutes from './routes/mobile-money-webhooks'
import packsRoutes from './routes/packs'
import adminShopsRoutes from './routes/admin-shops'
import adminProvidersRoutes from './routes/admin-providers'
import shopsSimpleRoutes from './routes/shops-simple'
import shopsRoutes from './routes/shops'
import adminCommissionsRoutes from './routes/admin-commissions'
import adminAnalyticsRoutes from './routes/admin-analytics'
import adminUsersRoutes from './routes/admin-users'
import adminPaymentsRoutes from './routes/admin-payments'
import commissionRoutes from './routes/commission-routes'
import commissionManagementRoutes from './routes/commission-management'
import paymentMethodsConfigRoutes from './routes/payment-methods-config'
import notificationsRoutes from './routes/notifications'
import reconciliationReportsRoutes from './routes/reconciliation-reports'
import testShopsRoutes from './routes/test-shops'
import demoBillingRoutes from './routes/demo-billing'
import userPackRoutes from './routes/user-pack'
import geolocationRoutes from './routes/geolocation'
import routingRoutes from './routes/routing'
import ordersRoutes from './routes/orders'
import boostsRoutes from './routes/boosts'
import adminBoostsRoutes from './routes/admin-boosts'
import localSyncRoutes from './routes/local-sync'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())

// Important: Stripe webhooks doivent recevoir le corps brut
app.use('/api/stripe-webhooks', express.raw({ type: 'application/json' }));
app.use('/api/stripe-webhooks', stripeWebhookRoutes);

// Important: PayPal webhooks doivent recevoir le corps brut
app.use('/api/paypal-webhooks', express.raw({ type: 'application/json' }));

// Important: Mobile Money webhooks doivent recevoir le corps brut
app.use('/api/mobile-money-webhooks', express.raw({ type: 'application/json' }));

// Pour toutes les autres routes, utiliser le parsing JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Route
 */
app.use('/api/shops/simple', shopsSimpleRoutes)
app.use('/api/shops', shopsRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/stripe-subscriptions', stripeSubscriptionRoutes)
app.use('/api/paypal', paypalRoutes)
app.use('/api/paypal-webhooks', paypalRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/mobile-money', mobileMoneyRoutes)
app.use('/api/mobile-money-webhooks', mobileMoneyWebhooksRoutes)
app.use('/api/packs', packsRoutes)
app.use('/api/boosts', boostsRoutes)

/**
 * Localhost sync API (PC ↔ téléphone en LAN)
 */
app.use('/api/local-sync', localSyncRoutes)

/**
 * Admin Routes
 */
app.use('/api/admin/shops', adminShopsRoutes)
app.use('/api/admin/providers', adminProvidersRoutes)
app.use('/api/admin/commissions', adminCommissionsRoutes)
app.use('/api/admin/analytics', adminAnalyticsRoutes)
app.use('/api/admin/payments', adminPaymentsRoutes)
app.use('/api/admin/commissions', commissionManagementRoutes)
app.use('/api/admin/payment-methods', paymentMethodsConfigRoutes)
app.use('/api/admin/notifications', notificationsRoutes)
app.use('/api/admin/reconciliation', reconciliationReportsRoutes)
app.use('/api/admin/boosts', adminBoostsRoutes)
app.use('/api/admin', adminUsersRoutes)
app.use('/api/commissions', commissionRoutes)

app.use('/admin/shops', adminShopsRoutes)
app.use('/admin/providers', adminProvidersRoutes)

/**
 * Test Routes (debug)
 */
app.use('/api/test', testShopsRoutes)
app.use('/api/demo-billing', demoBillingRoutes)
app.use('/api/user-pack', userPackRoutes)

/**
 * Maps & Geolocation (propriétaire)
 */
app.use('/api/geolocation', geolocationRoutes)
app.use('/api/routing', routingRoutes)
app.use('/api/orders', ordersRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
