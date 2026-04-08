/**
 * PricingPage — ADHDCal subscription plans
 *
 * Shows free vs pro plans, handles Stripe Checkout redirect,
 * and shows "Manage Subscription" for existing subscribers.
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Check, Zap, ArrowLeft, Star, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getBillingStatus, createCheckoutSession, createPortalSession } from '../services/billingService.js';

// ── Plan definitions ──────────────────────────────────────────────────────────
const FREE_FEATURES = [
  'Up to 25 tasks',
  '7-day scheduling window',
  'Google Calendar sync',
  'Basic task management',
  'Kanban board view',
];

const PRO_FEATURES = [
  'Unlimited tasks',
  '60-day scheduling window',
  'Brain Dump mode (rapid task capture)',
  'Pomodoro Focus Timer',
  'Smart task reminders',
  'SMS reminders (coming soon)',
  'Analytics & insights (coming soon)',
  'Priority support',
];

const PRICE_MONTHLY = 5.99;
const PRICE_ANNUAL_MONTH = 3.99;
const PRICE_ANNUAL_YEAR = 47.88;

// ── Component ─────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const { isAuthenticated, userProfile, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [plan, setPlan] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState(null);
  const [billingStatus, setBillingStatus] = useState(null);

  const checkoutResult = searchParams.get('checkout');

  // Load billing status if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      getBillingStatus()
        .then(setBillingStatus)
        .catch(() => {}); // non-fatal
    }
  }, [isAuthenticated]);

  const isPremium = billingStatus?.isPremium || userProfile?.isPremium;

  async function handleSubscribe() {
    if (!isAuthenticated) {
      navigate('/login?next=pricing');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = await createCheckoutSession(plan);
      window.location.href = url;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    setError(null);
    try {
      const url = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to open billing portal.');
      setPortalLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white">
      {/* ── Nav ── */}
      <nav className="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
        <Link
          to={isAuthenticated ? '/app' : '/'}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAuthenticated ? 'Back to app' : 'Back to home'}
        </Link>
        {isAuthenticated && userProfile && (
          <span className="text-sm text-gray-400">
            Signed in as <span className="font-medium text-gray-600">{userProfile.email}</span>
          </span>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-4 pb-24">

        {/* ── Success / cancel banners ── */}
        {checkoutResult === 'success' && (
          <div className="mb-8 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">You're all set! 🎉</p>
              <p className="text-sm">Your ADHDCal Pro subscription is now active. Enjoy unlimited power!</p>
            </div>
          </div>
        )}

        {checkoutResult === 'cancelled' && (
          <div className="mb-8 flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-5 py-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Checkout was cancelled. No charge was made. Ready when you are!</p>
          </div>
        )}

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-4">
            <Star className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Work with your brain,<br />
            <span className="text-indigo-600">not against it.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Start free. Upgrade when you're ready. No guilt-tripping, no dark patterns.
          </p>
        </div>

        {/* ── Billing toggle ── */}
        {!isPremium && (
          <div className="flex items-center justify-center gap-4 mb-10">
            <button
              onClick={() => setPlan('monthly')}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                plan === 'monthly'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPlan('annual')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                plan === 'annual'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'
              }`}
            >
              Annual
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                plan === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                Save 33%
              </span>
            </button>
          </div>
        )}

        {/* ── Pricing cards ── */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">

          {/* Free card */}
          <div className="bg-white rounded-3xl border border-gray-200 p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Free</h2>
              <p className="text-gray-500 text-sm">Get started at no cost.</p>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="text-gray-400 text-sm ml-1">/ forever</span>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div>
              {isAuthenticated && !isPremium ? (
                <div className="w-full py-3 px-6 bg-gray-100 text-gray-500 rounded-xl text-sm font-semibold text-center">
                  Current plan
                </div>
              ) : (
                <Link
                  to={isAuthenticated ? '/app' : '/login'}
                  className="block w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold text-center transition-colors"
                >
                  {isAuthenticated ? 'Continue with Free' : 'Get started free'}
                </Link>
              )}
            </div>
          </div>

          {/* Pro card */}
          <div className={`relative bg-gradient-to-b from-indigo-600 to-purple-700 rounded-3xl p-8 flex flex-col text-white shadow-2xl shadow-indigo-200/50 ${isPremium ? 'ring-4 ring-emerald-400 ring-offset-2' : ''}`}>
            {/* Badge */}
            {!isPremium && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-amber-900 text-xs font-bold px-4 py-1.5 rounded-full">
                  7-DAY FREE TRIAL
                </span>
              </div>
            )}
            {isPremium && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-emerald-400 text-emerald-900 text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active plan
                </span>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">Pro</h2>
                <Zap className="w-4 h-4 text-amber-300" />
              </div>
              <p className="text-indigo-200 text-sm">Everything you need to thrive.</p>
            </div>

            <div className="mb-8">
              {plan === 'monthly' || isPremium ? (
                <>
                  <span className="text-4xl font-bold">${PRICE_MONTHLY}</span>
                  <span className="text-indigo-200 text-sm ml-1">/ month</span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-bold">${PRICE_ANNUAL_MONTH}</span>
                  <span className="text-indigo-200 text-sm ml-1">/ month</span>
                  <div className="text-indigo-300 text-xs mt-1">
                    Billed ${PRICE_ANNUAL_YEAR}/year
                  </div>
                </>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-indigo-100">
                  <Check className="w-4 h-4 text-emerald-300 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              {error && (
                <div className="bg-red-500/20 border border-red-400/30 text-red-100 rounded-xl px-4 py-3 text-sm">
                  {error}
                </div>
              )}

              {isPremium ? (
                <>
                  <button
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                    className="w-full py-3.5 px-6 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Manage Subscription
                  </button>
                  {billingStatus?.subscription?.cancelAtPeriodEnd && (
                    <p className="text-indigo-300 text-xs text-center">
                      Cancels {new Date(billingStatus.subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full py-3.5 px-6 bg-white text-indigo-700 hover:bg-indigo-50 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {loading ? 'Redirecting to checkout…' : 'Start 7-day free trial'}
                  </button>
                  <p className="text-indigo-300 text-xs text-center">
                    No credit card required to start trial
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="max-w-2xl mx-auto mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Common questions</h2>
          <div className="space-y-6">
            {[
              {
                q: 'What happens after my free trial?',
                a: "After 7 days, you'll be charged based on your chosen plan. We'll send you a reminder before the trial ends. Cancel any time — no hoops to jump through."
              },
              {
                q: 'Can I cancel anytime?',
                a: "Yes, always. Click 'Manage Subscription' above to access the billing portal. You'll keep access until the end of your paid period."
              },
              {
                q: 'Is my data safe if I cancel?',
                a: "Yes. Your tasks and calendar data stay in your account. If you downgrade to Free, you keep your existing tasks — you just can't add more once you hit the 25-task limit."
              },
              {
                q: 'Do you offer refunds?',
                a: "If something isn't working and we can't fix it, we'll refund you. Just email support@absolute0.net."
              },
              {
                q: 'Can I switch between monthly and annual?',
                a: "Yes — use the Manage Subscription portal to switch plans. Annual billing gives you 2 months free."
              },
            ].map(({ q, a }) => (
              <div key={q} className="border-b border-gray-100 pb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{q}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust footer ── */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 text-sm">
            Questions? Email{' '}
            <a href="mailto:support@absolute0.net" className="text-indigo-600 hover:underline">
              support@absolute0.net
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
