// worker/recovery-worker.ts
// Long-running process, deployed separately from Next.js:
//   npx tsx worker/recovery-worker.ts
import { Worker } from 'bullmq';
import { convertedKey, getConnection, QUEUE_NAME } from '../lib/queue';
import { STORE } from '../lib/shopify';
import { createRecoveryDiscount } from '../lib/discount';
import { findSubscriberByEmail, sendRecoveryFlow, setRecoveryFields } from '../lib/manychat';

const worker = new Worker(
  QUEUE_NAME,
  async (job) => {
    const { checkoutToken, email, recoveryUrl } = job.data as {
      checkoutToken: string; email: string; recoveryUrl: string;
    };

    // orders/create normally removes the job; this covers the race
    if (await getConnection().get(convertedKey(checkoutToken))) return 'converted';

    // ManyChat can only message people who already subscribed to the bot
    const subscriberId = await findSubscriberByEmail(email);
    if (!subscriberId) return 'no_manychat_subscriber';

    const code = await createRecoveryDiscount(checkoutToken);

    // /discount/CODE applies the code, then redirects back into the saved checkout
    const target = new URL(recoveryUrl);
    const link = `https://${STORE}/discount/${encodeURIComponent(code)}` +
      `?redirect=${encodeURIComponent(target.pathname + target.search)}`;

    await setRecoveryFields(subscriberId, link, code);
    await sendRecoveryFlow(subscriberId);
    return `sent ${code}`;
  },
  { connection: getConnection(), concurrency: 5 },
);

worker.on('completed', (job, result) => console.log(`[eacjyd-yz] ${job.id}: ${result}`));
worker.on('failed', (job, err) => console.error(`[eacjyd-yz] ${job?.id} failed: ${err.message}`));
