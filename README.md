- Clone the repo

```jsx
git clone https://github.com/devmehtaa/walleti.git
```
```bash
npm i --legacy-peer-deps
```
- Run Postgres + Redis (recommended):

```bash
docker compose up -d
```

Or Postgres only:

```bash
docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
```

- Copy over all .env.example files to .env
- Update .env files everywhere with the right db url
```bash
postgresql://postgres:mysecretpassword@localhost:5432/postgres
```

- Go to `packages/db`
    - npx prisma migrate dev
    - npx prisma db seed
- Add `REDIS_URL=redis://localhost:6379` to `apps/user-app/.env`
- From `apps/user-app`: `npm run redis:init` (seed feature flags)
- Go to `apps/user-app`, run `npm run dev`
- Try logging in using phone - 1111111111 , password - alice (See `seed.ts`)

### Redis features (user app)

| Feature | Purpose |
|---------|---------|
| Session cache | Faster auth; logout invalidates cached session |
| Rate limits | Login, P2P, top-up, OTP |
| Stripe idempotency | Prevents double wallet credit on webhook retries |
| Balance cache | 5-minute cache; invalidated on transfers/top-ups |
| Transfer locks | Prevents concurrent P2P race conditions |
| On-ramp polling | `/api/onramp/[token]/status` for live Stripe status |
| Fraud velocity | Daily top-up & transfer limits |
| Activity feed | Dashboard recent events |
| Leaderboard | Daily top senders |
| Notification queue | Consumed by `notification-worker` (email / SMS / FCM) |
| Feature flags | `stripe_onramp`, `p2p_transfer`, `maintenance_mode` |

### Dedicated workers

Run in separate terminals (after `docker compose up -d` and copying `.env` files):

```bash
# 1. User app
cd apps/user-app && npm run dev

# 2. Stripe webhook consumer (processes queued Stripe events)
cd apps/stripe-webhook-consumer && npm run dev

# 3. Notification worker (email → Mailhog, SMS/FCM log or provider)
cd apps/notification-worker && npm run dev

# 4. Reconciliation worker (periodic balance checks)
cd apps/reconciliation-worker && npm run dev
```

Copy `apps/notification-worker/.env.example` → `.env` and set `DATABASE_URL` + `REDIS_URL`.  
Email in dev: open **http://localhost:8025** (Mailhog UI).

Stripe flow: webhook enqueues to Redis → `stripe-webhook-consumer` credits wallet → `notification-worker` sends push.

### Observability (Prometheus + Grafana)

```bash
docker compose up -d prometheus grafana
```

| URL | Purpose |
|-----|---------|
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (`admin` / `admin`) |

Dashboard: **Walleti Overview** — transfer latency, webhook lag, Redis hit rate, failed logins.

Metrics endpoints:

| Service | Metrics URL |
|---------|-------------|
| user-app | http://localhost:3001/api/metrics |
| notification-worker | http://localhost:9101/metrics |
| stripe-webhook-consumer | http://localhost:9102/metrics |
| reconciliation-worker | http://localhost:9103/metrics |

### Add money with Stripe

1. Create a [Stripe](https://stripe.com) account and copy test API keys into `apps/user-app/.env`:
   - `STRIPE_SECRET_KEY` — Secret key (`sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` — from Stripe CLI (see below)
2. Forward webhooks locally (in a separate terminal):

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

3. Open **Transfer** → enter an amount → **Pay with Stripe**. Use test card `4242 4242 4242 4242`, any future expiry, any CVC.