// app/api/webhooks/shopify/route.ts
import { verifyWebhook } from '@/lib/shopify';
import { convertedKey, getConnection, getQueue, jobIdFor } from '@/lib/queue';

export const runtime = 'nodejs'; // needs node:crypto and a TCP Redis connection

const MIN_CART_VALUE = 40;
const RECOVERY_DELAY_MS = Number(process.env.RECOVERY_DELAY_MINUTES ?? 30) * 60_000;

export async function POST(req: Request) {
  // Read the raw body first: the HMAC is computed over these exact bytes
  const rawBody = await req.text();
  if (!verifyWebhook(rawBody, req.headers.get('x-shopify-hmac-sha256'))) {
    return new Response('Invalid HMAC', { status: 401 });
  }

  const topic = req.headers.get('x-shopify-topic');
  const payload = JSON.parse(rawBody);

  if (topic === 'orders/create') {
    // The shopper finished checking out: cancel any pending recovery
    const token: string | undefined = payload.checkout_token;
    if (token) {
      await getConnection().set(convertedKey(token), '1', 'EX', 7 * 24 * 60 * 60);
      await getQueue().remove(jobIdFor(token));
    }
    return Response.json({ ok: true });
  }

  if (topic === 'checkouts/create' || topic === 'checkouts/update') {
    const total = parseFloat(payload.total_price ?? '0');
    if (payload.completed_at) return Response.json({ ok: true, skipped: 'completed' });
    if (!payload.email || total < MIN_CART_VALUE) {
      return Response.json({ ok: true, skipped: 'not_eligible' });
    }
    if (payload.buyer_accepts_marketing !== true) {
      return Response.json({ ok: true, skipped: 'no_marketing_consent' });
    }
    if (await getConnection().get(convertedKey(payload.token))) {
      return Response.json({ ok: true, skipped: 'converted' });
    }

    // One job per checkout. Adding an existing jobId is a no-op, so
    // checkouts/update neither duplicates the job nor restarts the timer.
    await getQueue().add(
      'recover',
      {
        checkoutToken: payload.token,
        email: payload.email,
        total,
        recoveryUrl: payload.abandoned_checkout_url,
      },
      {
        jobId: jobIdFor(payload.token),
        delay: RECOVERY_DELAY_MS,
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: 5000,
        removeOnFail: 5000,
      },
    );
    return Response.json({ ok: true, queued: true });
  }

  return Response.json({ ok: true, ignored: topic });
}
