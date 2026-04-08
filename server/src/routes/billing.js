/**
 * ADHDCal Billing Routes — Stripe Integration
 * 
 * Endpoints:
 *   POST /api/billing/create-checkout    → Stripe Checkout session for new sub
 *   POST /api/billing/create-portal      → Stripe Customer Portal (manage / cancel)
 *   GET  /api/billing/status             → Current subscription status
 *   POST /api/billing/webhook            → Stripe webhook (update DB on events)
 * 
 * Pricing:
 *   Monthly  $5.99/mo
 *   Annual   $47.88/yr ($3.99/mo — save 33%)
 */

import express from 'express';
import Stripe from 'stripe';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { userQueries } from '../services/database.js';
import { config } from '../config/index.js';

const router = express.Router();

// ── Stripe init ──────────────────────────────────────────────────────────────
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || config.clientUrl || 'https://adhdcal.top';

let stripe = null;
let PRICE_IDS = { monthly: null, annual: null };

async function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  if (!stripe) {
    stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });
    PRICE_IDS = await initPrices(stripe);
  }
  return stripe;
}

async function initPrices(s) {
  // Find or create the ADHDCal Pro product + prices
  const products = await s.products.list({ limit: 20, active: true });
  let product = products.data.find(p => p.metadata?.app === 'adhdcal');

  if (!product) {
    product = await s.products.create({
      name: 'ADHDCal Pro',
      description: 'Unlimited tasks, extended scheduling, brain dump, SMS reminders, analytics, and more.',
      metadata: { app: 'adhdcal' },
    });
  }

  const prices = await s.prices.list({ product: product.id, active: true, limit: 20 });

  let monthly = prices.data.find(p =>
    p.recurring?.interval === 'month' && p.unit_amount === 599
  );
  let annual = prices.data.find(p =>
    p.recurring?.interval === 'year' && p.unit_amount === 4788
  );

  if (!monthly) {
    monthly = await s.prices.create({
      product: product.id,
      unit_amount: 599,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'monthly' },
    });
  }

  if (!annual) {
    annual = await s.prices.create({
      product: product.id,
      unit_amount: 4788,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan: 'annual' },
    });
  }

  console.log(`💳 ADHDCal Stripe prices ready — monthly: ${monthly.id}  annual: ${annual.id}`);
  return { monthly: monthly.id, annual: annual.id };
}

// ── Helper: get or create Stripe customer for a user ───────────────────────
async function getOrCreateCustomer(s, user) {
  if (user.stripe_customer_id) {
    return user.stripe_customer_id;
  }

  const customer = await s.customers.create({
    email: user.email,
    name: user.display_name || user.email,
    metadata: { userId: String(user.id) },
  });

  // Persist customer ID
  await userQueries.updateStripeCustomer(user.id, customer.id);
  return customer.id;
}

// ── POST /api/billing/create-checkout ───────────────────────────────────────
router.post('/create-checkout', authMiddleware, async (req, res) => {
  try {
    const s = await getStripe();
    if (!s) return res.status(503).json({ error: 'Payments not configured' });

    const { plan = 'monthly' } = req.body;
    const priceId = plan === 'annual' ? PRICE_IDS.annual : PRICE_IDS.monthly;

    if (!priceId) {
      return res.status(500).json({ error: 'Price configuration error' });
    }

    const user = req.user;
    const customerId = await getOrCreateCustomer(s, user);

    const session = await s.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: String(user.id) },
      },
      success_url: `${APP_URL}/app?checkout=success&plan=${plan}`,
      cancel_url: `${APP_URL}/pricing?checkout=cancelled`,
      metadata: { userId: String(user.id), plan },
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('create-checkout error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/billing/create-portal ─────────────────────────────────────────
router.post('/create-portal', authMiddleware, async (req, res) => {
  try {
    const s = await getStripe();
    if (!s) return res.status(503).json({ error: 'Payments not configured' });

    const user = req.user;
    if (!user.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found. Subscribe first.' });
    }

    const session = await s.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `${APP_URL}/app/settings`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('create-portal error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/billing/status ──────────────────────────────────────────────────
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const isPremium =
      user.subscription_tier === 'premium' &&
      (!user.subscription_expires_at || new Date(user.subscription_expires_at) >= new Date());

    const s = await getStripe();
    let subscriptionDetails = null;

    if (s && user.stripe_customer_id && isPremium) {
      try {
        const subs = await s.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'active',
          limit: 1,
        });
        if (subs.data.length > 0) {
          const sub = subs.data[0];
          subscriptionDetails = {
            status: sub.status,
            currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
            plan: sub.items.data[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly',
          };
        }
      } catch (_) {
        // Non-fatal — still return tier info
      }
    }

    res.json({
      tier: user.subscription_tier || 'free',
      isPremium,
      subscriptionExpiresAt: user.subscription_expires_at,
      subscription: subscriptionDetails,
      hasStripeAccount: !!user.stripe_customer_id,
      paymentsEnabled: !!STRIPE_SECRET_KEY,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/billing/webhook ────────────────────────────────────────────────
// Must receive raw body — mount BEFORE express.json() in app.js
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const s = await getStripe();
  if (!s) return res.sendStatus(200); // graceful no-op

  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = s.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const data = event.data.object;

  try {
    switch (event.type) {
      // ── Subscription activated / renewed ──────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const userId = data.metadata?.userId || data.customer;
        if (!userId) break;

        const isActive = ['active', 'trialing'].includes(data.status);
        const expiresAt = new Date(data.current_period_end * 1000);

        if (isActive) {
          // Find user by stripe customer id if userId is a customer id
          let user = null;
          if (!isNaN(Number(userId))) {
            user = await userQueries.getById(Number(userId));
          } else {
            user = await userQueries.findByStripeCustomer(userId);
          }
          if (user) {
            await userQueries.updateSubscription(user.id, 'premium', expiresAt);
            console.log(`✅ Upgraded user ${user.email} to premium (expires ${expiresAt.toISOString()})`);
          }
        }
        break;
      }

      // ── Subscription cancelled / expired ──────────────────────────────────
      case 'customer.subscription.deleted': {
        const userId = data.metadata?.userId;
        let user = null;
        if (userId && !isNaN(Number(userId))) {
          user = await userQueries.getById(Number(userId));
        } else {
          user = await userQueries.findByStripeCustomer(data.customer);
        }
        if (user) {
          await userQueries.updateSubscription(user.id, 'free', null);
          console.log(`⬇️  Downgraded user ${user.email} to free (subscription cancelled)`);
        }
        break;
      }

      // ── Invoice paid (renewal) ─────────────────────────────────────────────
      case 'invoice.paid': {
        if (data.subscription) {
          const sub = await s.subscriptions.retrieve(data.subscription);
          const userId = sub.metadata?.userId;
          if (userId && !isNaN(Number(userId))) {
            const user = await userQueries.getById(Number(userId));
            if (user) {
              const expiresAt = new Date(sub.current_period_end * 1000);
              await userQueries.updateSubscription(user.id, 'premium', expiresAt);
            }
          }
        }
        break;
      }

      // ── Invoice payment failed ─────────────────────────────────────────────
      case 'invoice.payment_failed': {
        // Log but don't downgrade immediately — Stripe retries
        console.warn(`⚠️  Invoice payment failed for customer ${data.customer}`);
        break;
      }

      default:
        // Unhandled event type — ignore
    }
  } catch (err) {
    console.error(`Error processing webhook ${event.type}:`, err.message);
    // Still return 200 to prevent Stripe retrying
  }

  res.sendStatus(200);
});

export default router;
