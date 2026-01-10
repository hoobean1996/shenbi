# Shenbi Production Checklist

A step-by-step guide to launch Shenbi as a commercial product.

---

## Phase 1: Infrastructure Setup

### Domain (Cloudflare)

- [ ] Create Cloudflare account at [cloudflare.com](https://cloudflare.com)
- [ ] Search and purchase domain (e.g., `shenbi.app`, `shenbi.io`)
- [ ] Verify domain ownership

### Backend Hosting (Railway)

- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Connect GitHub account
- [ ] Add billing method ($5 free trial credit available)

### Email (Resend)

- [ ] Create Resend account at [resend.com](https://resend.com) ✅ Done
- [ ] Add domain in Resend dashboard
- [ ] Add DNS records for domain verification
- [ ] Update `EMAIL_FROM` to use your domain

---

## Phase 2: Deployment

### Backend on Railway

- [ ] Create new project in Railway
- [ ] Add PostgreSQL database service
- [ ] Deploy backend from GitHub (`shenbid/` folder)
- [ ] Set environment variables:
  ```
  DATABASE_URL=<from Railway PostgreSQL>
  SECRET_KEY=<generate with: openssl rand -hex 32>
  CORS_ORIGINS=https://yourdomain.com
  STRIPE_SECRET_KEY=sk_live_xxx
  STRIPE_PUBLISHABLE_KEY=pk_live_xxx
  STRIPE_PRICE_ID=price_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx
  RESEND_API_KEY=re_xxx
  EMAIL_FROM=Shenbi <noreply@yourdomain.com>
  ENV=production
  ```
- [ ] Run database migrations
- [ ] Verify API is accessible

### Frontend on Cloudflare Pages

- [ ] Create new Pages project in Cloudflare
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Output directory: `dist`
- [ ] Add environment variables if needed
- [ ] Deploy and verify

### DNS Configuration

- [ ] Point frontend domain to Cloudflare Pages
- [ ] Create subdomain for API (e.g., `api.shenbi.app`)
- [ ] Point API subdomain to Railway backend
- [ ] Verify SSL certificates are active

---

## Phase 3: Stripe Production

### Stripe Dashboard Setup

- [ ] Complete Stripe account verification
  - [ ] Business information
  - [ ] Bank account for payouts
  - [ ] Identity verification
- [ ] Create product: "Shenbi Premium"
- [ ] Create price (e.g., $9.99/month)
- [ ] Copy Price ID (`price_xxx`)

### Stripe Live Keys

- [ ] Get live API keys from Stripe Dashboard
  - [ ] Publishable key (`pk_live_xxx`)
  - [ ] Secret key (`sk_live_xxx`)
- [ ] Update Railway environment variables

### Stripe Webhook

- [ ] Add webhook endpoint: `https://api.yourdomain.com/api/stripe/webhook`
- [ ] Select events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- [ ] Copy webhook secret (`whsec_xxx`)
- [ ] Update Railway environment variables

### Test Live Payment

- [ ] Make a test purchase with real card
- [ ] Verify payment in Stripe Dashboard
- [ ] Check premium status in app
- [ ] Refund yourself

---

## Phase 4: Security Hardening

### Secrets & Config

- [ ] Generate strong SECRET_KEY: `openssl rand -hex 32`
- [ ] Configure Lemonade API key (VITE_LEMONADE_API_KEY)
- [ ] Configure Google OAuth Client ID (VITE_GOOGLE_CLIENT_ID)
- [ ] Restrict CORS to production domain only
- [ ] Verify `.env` files are in `.gitignore`

### SSL & HTTPS

- [ ] Verify HTTPS works on frontend
- [ ] Verify HTTPS works on backend API
- [ ] Enable "Always Use HTTPS" in Cloudflare

### Rate Limiting (Optional)

- [ ] Configure rate limiting in Cloudflare
- [ ] Add rate limiting to sensitive API endpoints

---

## Phase 5: Monitoring & Operations

### Error Tracking

- [ ] Create Sentry account at [sentry.io](https://sentry.io)
- [ ] Add Sentry to backend
- [ ] Add Sentry to frontend
- [ ] Test error reporting

### Uptime Monitoring

- [ ] Create account at [betteruptime.com](https://betteruptime.com) (free)
- [ ] Add monitors for:
  - [ ] Frontend URL
  - [ ] Backend API health endpoint
- [ ] Set up alerts (email/SMS)

### Database Backups

- [ ] Enable automatic backups in Railway
- [ ] Verify backup schedule
- [ ] Test backup restoration (optional)

### Analytics (Optional)

- [ ] Add PostHog or Mixpanel
- [ ] Track key events (sign up, upgrade, level complete)

---

## Phase 6: Legal & Compliance

### Required Pages

- [ ] Create Privacy Policy page
  - Data collected
  - How data is used
  - PDPA compliance (Singapore)
- [ ] Create Terms of Service page
  - User responsibilities
  - Service limitations
  - Liability disclaimers
- [ ] Create Refund Policy
  - Subscription cancellation
  - Refund conditions

### Stripe Requirements

- [ ] Display refund policy during checkout
- [ ] Provide customer support contact

---

## Phase 7: Launch Preparation

### Testing

- [ ] Test full user flow (free user)
- [ ] Test payment flow (upgrade to premium)
- [ ] Test on mobile devices
- [ ] Test in different browsers

### Content

- [ ] Verify all translations are complete
- [ ] Check for placeholder/test content
- [ ] Review email templates

### Go Live

- [ ] Switch Stripe to live mode
- [ ] Announce on social media
- [ ] Share with early users

---

## Quick Reference

### Production URLs

| Service | URL |
|---------|-----|
| Frontend | `https://yourdomain.com` |
| Backend API | `https://api.yourdomain.com` |
| Stripe Webhook | `https://api.yourdomain.com/api/stripe/webhook` |

### Environment Variables (Production)

**Frontend (.env):**
```bash
VITE_API_URL=https://api.yourdomain.com
VITE_LEMONADE_API_KEY=your-lemonade-api-key
VITE_LEMONADE_BASE_URL=https://api.gigaboo.sg
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

**Backend:**
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/db

# Security
SECRET_KEY=<64-char-hex-string>
CORS_ORIGINS=https://yourdomain.com

# Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_PRICE_ID=price_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email
RESEND_API_KEY=re_xxx
EMAIL_FROM=Shenbi <noreply@yourdomain.com>

# Environment
ENV=production
```

### Useful Commands

```bash
# Generate secret key
openssl rand -hex 32

# Test email
cd shenbid && uv run python scripts/test_email.py your@email.com

# Local docker deployment
cd deploy && docker compose up --build
```

---

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Cloudflare (Domain + Pages) | ~$1/mo (domain amortized) |
| Railway (Backend + DB) | ~$5-15/mo |
| Resend (Email) | Free (3K/mo) |
| Stripe | 2.9% + $0.30 per transaction |
| Sentry | Free tier |
| BetterUptime | Free tier |
| **Total** | **~$6-16/mo + Stripe fees** |

---

*Last Updated: December 2024*
