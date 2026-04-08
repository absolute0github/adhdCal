/**
 * ADHDCal Billing Service
 * Wraps all Stripe-related API calls.
 */

import api from './api.js';

/**
 * Get current subscription status for the logged-in user.
 */
export async function getBillingStatus() {
  const res = await api.get('/billing/status');
  return res.data;
}

/**
 * Start a Stripe Checkout session.
 * @param {'monthly'|'annual'} plan
 * @returns {string} Stripe Checkout URL — redirect the user there
 */
export async function createCheckoutSession(plan = 'monthly') {
  const res = await api.post('/billing/create-checkout', { plan });
  return res.data.url;
}

/**
 * Open the Stripe Customer Portal (manage / cancel subscription).
 * @returns {string} Stripe Portal URL
 */
export async function createPortalSession() {
  const res = await api.post('/billing/create-portal');
  return res.data.url;
}
