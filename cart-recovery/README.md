# Cart recovery for eacjyd-yz.myshopify.com

When a shopper who opted in to marketing leaves a checkout worth $40 or more, this waits 30 minutes. If they still haven't ordered, it creates a single-use 10% discount code and sends it to them through a ManyChat flow.

## How it works

1. Shopify sends `checkouts/create` and `checkouts/update` to `/api/webhooks/shopify`.
2. The route checks the Shopify signature, skips carts under $40 or without marketing consent, and queues one delayed job per checkout in Redis.
3. If the shopper places an order, `orders/create` removes the job, so nothing is sent.
4. After 30 minutes the worker looks up the shopper in ManyChat by email, creates a `RECOVER10-XXXXXX` code (10% off, 48 hours, $40 minimum, single use) and triggers your ManyChat flow with the link.

## What runs where

| Part | Where | Cost |
| --- | --- | --- |
| Webhook route (Next.js) | Vercel, with Root Directory set to `cart-recovery` | Free tier |
| Redis | Upstash or the Redis add-on on your worker host | Free tier |
| Worker (`npm run worker`) | Railway or Render, always on | About $5/month |

The worker can't run on Vercel because Vercel functions stop after each request.

## Setup

### 1. Shopify app

1. In the store admin, go to Settings → Apps → Develop apps and create **Cart Recovery Bot**. If that option is gone, create the app in the Shopify Dev Dashboard and install it on this store.
2. Give it two Admin API scopes: `read_orders` and `write_discounts`.
3. Under Protected customer data, request access to customer email. Without it, checkout webhooks arrive without the email and every cart is skipped.
4. Install the app. Keep the Admin API access token and the API secret key for step 4.

### 2. ManyChat

1. Create two Text custom fields: `recovery_url` and `discount_code`. Note each field's numeric ID.
2. Build a flow called **Cart recovery** with a message that includes `{{discount_code}}` and a URL button pointing to `{{recovery_url}}`.
3. Copy the flow's namespace (the `content…` part of the flow's URL).
4. Make sure your opt-in flow collects email. The worker can only message shoppers it can find by email.
5. Settings → API → generate an API key.

Messenger and Instagram allow promotional messages only within 24 hours of the subscriber's last message, or to subscribers who opted in to marketing messages. Outside that window, add ManyChat's email or SMS step to the flow.

### 3. Redis

Create a Redis database (for example on Upstash) and copy its connection URL (`rediss://…`).

### 4. Deploy the webhook route on Vercel

1. Import this GitHub repository in Vercel and set **Root Directory** to `cart-recovery`.
2. Add every variable from `.env.example` under Settings → Environment Variables, with your real values.
3. Deploy. Opening the project URL should show "Cart recovery webhook is running."

### 5. Deploy the worker

1. On Railway or Render, create a service from this repository with root directory `cart-recovery`.
2. Build command: `npm install`. Start command: `npm run worker`.
3. Give it the same environment variables as Vercel.

### 6. Register the webhooks

On your computer, with `jq` and `curl` installed and the variables from `.env.example` exported:

```bash
cd cart-recovery
./scripts/register-webhooks.sh
```

### 7. Test

1. Set `RECOVERY_DELAY_MINUTES=2` on both Vercel and the worker.
2. Subscribe to your ManyChat bot with an email address.
3. On the store, add over $40 to the cart, start checkout with that same email, tick the marketing box and close the tab.
4. Within about 2 minutes you should get the message, and the link should apply the code.
5. Repeat, but finish the order. No message should arrive.
6. Set `RECOVERY_DELAY_MINUTES` back to 30.

The worker logs one line per checkout: `sent RECOVER10-…`, `converted`, or `no_manychat_subscriber`.

## Check before going live

- **API version:** the code targets Shopify Admin API `2026-07`. If the store uses a different stable version, change `SHOPIFY_API_VERSION`.
- **ManyChat lookup:** confirm what ManyChat returns for an email with no subscriber. `lib/manychat.ts` treats a 400 or 404 as "not found".
- **Secrets:** keep the tokens only in Vercel and the worker host. Never commit `.env.local`.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev                  # webhook route on http://localhost:3000
npm run worker               # in a second terminal
npm run typecheck
```
