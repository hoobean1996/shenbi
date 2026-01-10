# Stripe Payment Integration

Stripe Checkout integration for Shenbi Premium subscriptions.

---

## Overview

Shenbi uses Stripe Checkout for subscription payments. The flow is:

1. User clicks locked premium level → Upgrade modal
2. User clicks "Upgrade Now" → Redirect to Stripe Checkout
3. After payment → Stripe redirects to `/upgrade/success`
4. Webhook updates user's `subscription_tier` to "premium"

---

## Configuration

### Environment Variables

```bash
# Backend (.env)
STRIPE_SECRET_KEY=sk_test_xxx       # or sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # or pk_live_xxx
STRIPE_PRICE_ID=price_xxx           # Your subscription price ID
STRIPE_WEBHOOK_SECRET=whsec_xxx     # Webhook signing secret
```

### Key Files

| File | Purpose |
|------|---------|
| `shenbid/app/config.py` | Stripe configuration settings |
| `shenbid/app/routers/stripe.py` | Payment endpoints |
| `src/services/api.ts` | Frontend Stripe API calls |

---

## Payment Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │     │   Backend   │     │   Stripe    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ Click "Upgrade"   │                   │
       │──────────────────>│                   │
       │                   │                   │
       │                   │ Create Session    │
       │                   │──────────────────>│
       │                   │                   │
       │                   │   Session URL     │
       │                   │<──────────────────│
       │   Redirect        │                   │
       │<──────────────────│                   │
       │                   │                   │
       │   Payment Page    │                   │
       │──────────────────────────────────────>│
       │                   │                   │
       │   Complete        │                   │
       │<──────────────────────────────────────│
       │                   │                   │
       │ Redirect to       │   Webhook Event   │
       │ /upgrade/success  │<──────────────────│
       │                   │                   │
       │ Verify Session    │                   │
       │──────────────────>│                   │
       │                   │                   │
       │   Premium Status  │                   │
       │<──────────────────│                   │
```

---

## API Endpoints

### `GET /api/stripe/config`

Returns publishable key for frontend initialization.

**Response:**
```json
{
  "publishable_key": "pk_test_xxx"
}
```

### `POST /api/stripe/checkout`

Creates a Checkout Session.

**Response:**
```json
{
  "checkout_url": "https://checkout.stripe.com/..."
}
```

### `POST /api/stripe/verify?session_id=xxx`

Verifies completed checkout and upgrades user.

**Response:**
```json
{
  "success": true,
  "subscription_tier": "premium"
}
```

### `POST /api/stripe/webhook`

Handles Stripe webhook events.

**Handled events:**
- `checkout.session.completed` - Initial subscription
- `customer.subscription.updated` - Renewal
- `customer.subscription.deleted` - Cancellation

### `POST /api/stripe/reset-to-free`

Development only - resets user to free tier.

---

## User Model Fields

```python
subscription_tier: str        # "free" or "premium"
subscription_started_at: datetime | None
subscription_expires_at: datetime | None
```

---

## Testing Locally

### 1. Start Servers

```bash
# Backend
cd shenbid && uv run uvicorn app.main:app --reload

# Frontend
npm run dev
```

### 2. Test Purchase

1. Click a premium level (e.g., turtle level 4+)
2. Click "Upgrade Now"
3. Use test card: `4242 4242 4242 4242`
4. Any future date, any CVC

### 3. Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks
stripe listen --forward-to localhost:8000/api/stripe/webhook
```

---

## Going Live

### 1. Stripe Dashboard Setup

#### Activate Account
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Complete verification:
   - Business information
   - Bank account for payouts
   - Identity verification

#### Create Product
1. Go to **Products** → **Add Product**
2. Name: "Shenbi Premium"
3. Add recurring price (e.g., $9.99/month)
4. Copy the **Price ID** (`price_xxx`)

#### Get Live Keys
1. Go to **Developers** → **API Keys**
2. Toggle off "Test mode"
3. Copy live keys:
   - `pk_live_xxx` (publishable)
   - `sk_live_xxx` (secret)

#### Setup Webhook
1. Go to **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://your-domain.com/api/stripe/webhook`
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret (`whsec_xxx`)

### 2. Update Production Environment

```bash
# Stripe - LIVE MODE
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
ENV=production
```

### 3. Pre-Launch Checklist

- [ ] Stripe account verified and activated
- [ ] Bank account connected for payouts
- [ ] Live product and price created
- [ ] Live API keys configured
- [ ] Webhook endpoint added
- [ ] HTTPS enabled
- [ ] CORS origins updated

### 4. Test Live Payment

1. Make a test purchase with your own card
2. Verify payment in Stripe Dashboard
3. Check premium status in app
4. Verify subscription dates in Profile
5. Refund yourself if needed

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check URL is publicly accessible
2. Verify HTTPS is working
3. Check Stripe Dashboard → Webhooks → Recent events
4. Ensure `STRIPE_WEBHOOK_SECRET` matches

### Payment Succeeds but User Not Upgraded

1. Check webhook logs for errors
2. Verify `client_reference_id` is set
3. Check database for subscription fields

### "Stripe not configured" Error

Ensure all environment variables are set:
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_PRICE_ID`

---

## Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Docs](https://stripe.com/docs/webhooks)
- [Stripe API Reference](https://stripe.com/docs/api)

---

*See also: [Backend API](./backend.md) | [Architecture](./architecture.md)*
