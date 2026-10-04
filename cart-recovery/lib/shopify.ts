// lib/shopify.ts
import crypto from 'node:crypto';

export const STORE = process.env.SHOPIFY_STORE!; // eacjyd-yz.myshopify.com
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2026-07';

export function verifyWebhook(rawBody: string, hmacHeader: string | null): boolean {
  if (!hmacHeader) return false;
  const expected = crypto
    .createHmac('sha256', process.env.SHOPIFY_API_SECRET!)
    .update(rawBody, 'utf8')
    .digest();
  const received = Buffer.from(hmacHeader, 'base64');
  // timingSafeEqual throws when lengths differ, so compare lengths first
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
}

export async function adminGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_TOKEN!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Shopify ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error(`Shopify GraphQL: ${JSON.stringify(json.errors)}`);
  return json.data as T;
}
