import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const TTL = {
  '72h':     72 * 60 * 60,       // 259200 seconds
  'monthly': 30 * 24 * 60 * 60,  // 2592000 seconds
  'lifetime': null,               // no expiry
};

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => chars[b % chars.length]).join('');
}

export default async function handler(req, res) {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

  // Idempotency — return same credentials if called more than once
  const existing = await kv.get(`session:${session_id}`);
  if (existing) return res.status(200).json(existing);

  // Retrieve and validate the Stripe session
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['subscription'],
    });
  } catch {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  if (stripeSession.payment_status !== 'paid') {
    return res.status(402).json({ error: 'Pagamento não confirmado' });
  }

  const plan = stripeSession.metadata?.plan;
  if (!plan || !TTL.hasOwnProperty(plan)) {
    return res.status(400).json({ error: 'Plano inválido' });
  }

  // Generate credentials
  const username = 'user_' + randomString(8);
  const password = randomString(12);

  const ttlSeconds = TTL[plan];
  const expiresAt  = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
  const credValue  = { password, plan, expiresAt };

  // Store credentials with TTL
  if (ttlSeconds !== null) {
    await kv.set(`cred:${username}`, credValue, { ex: ttlSeconds });
  } else {
    await kv.set(`cred:${username}`, credValue);
  }

  // For monthly subscriptions, store sub → username so the webhook can find it on renewal
  const subId = stripeSession.subscription?.id ?? stripeSession.subscription;
  if (plan === 'monthly' && subId) {
    await kv.set(`sub:${subId}`, username);
  }

  // Mark session as processed (idempotency guard — no TTL, cheap to keep forever)
  const result = { username, password, plan };
  await kv.set(`session:${session_id}`, result);

  return res.status(200).json(result);
}
