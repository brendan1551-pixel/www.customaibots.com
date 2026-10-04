// lib/queue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export const QUEUE_NAME = 'cart-recovery-eacjyd-yz';

// Created on first use, so `next build` never opens a Redis connection
let connection: IORedis | undefined;
let queue: Queue | undefined;

export function getConnection(): IORedis {
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL is not set');
  // BullMQ workers require maxRetriesPerRequest: null
  connection ??= new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  return connection;
}

export function getQueue(): Queue {
  queue ??= new Queue(QUEUE_NAME, { connection: getConnection() });
  return queue;
}

export const jobIdFor = (checkoutToken: string) => `checkout-${checkoutToken}`;
export const convertedKey = (checkoutToken: string) => `eacjyd-yz:converted:${checkoutToken}`;
