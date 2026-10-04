// lib/manychat.ts
const BASE = 'https://api.manychat.com/fb';
const headers = {
  Authorization: `Bearer ${process.env.MANYCHAT_API_KEY}`,
  'Content-Type': 'application/json',
};

async function post(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const json = await res.json();
  if (json.status !== 'success') throw new Error(`ManyChat ${path}: ${JSON.stringify(json)}`);
  return json.data;
}

// Returns the ManyChat subscriber id, or null if nobody with this email has opted in
export async function findSubscriberByEmail(email: string): Promise<number | null> {
  const res = await fetch(
    `${BASE}/subscriber/findBySystemField?email=${encodeURIComponent(email)}`,
    { headers },
  );
  if (res.status === 404) return null;
  const json = await res.json();
  if (json.status !== 'success') {
    if (res.status === 400) return null; // ManyChat reports "not found" as a 400 for some accounts
    throw new Error(`ManyChat findBySystemField: ${JSON.stringify(json)}`);
  }
  return json.data?.id ?? null;
}

export async function setRecoveryFields(subscriberId: number, recoveryUrl: string, code: string) {
  await post('/subscriber/setCustomFields', {
    subscriber_id: subscriberId,
    fields: [
      { field_id: Number(process.env.MANYCHAT_URL_FIELD_ID), field_value: recoveryUrl },
      { field_id: Number(process.env.MANYCHAT_CODE_FIELD_ID), field_value: code },
    ],
  });
}

export async function sendRecoveryFlow(subscriberId: number) {
  await post('/sending/sendFlow', {
    subscriber_id: subscriberId,
    flow_ns: process.env.MANYCHAT_FLOW_NS,
  });
}
