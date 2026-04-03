import Stripe from 'stripe';
import { kv } from '@vercel/kv';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// CRITICAL: disable body parsing so we get raw bytes for Stripe signature verification
export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const raw = await getRawBody(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  try {
    switch (event.type) {

      case 'invoice.payment_succeeded': {
        // Fires on every successful subscription payment (including first one).
        // Extends the credential TTL by 30 days.
        const invoice = event.data.object;
        const subId   = invoice.subscription;
        if (!subId) break;

        const username = await kv.get(`sub:${subId}`);
        if (!username) break;

        const cred = await kv.get(`cred:${username}`);
        if (!cred || cred.plan !== 'monthly') break;

        const newExpiresAt   = Date.now() + 30 * 24 * 60 * 60 * 1000;
        const ttlSeconds     = 30 * 24 * 60 * 60;
        await kv.set(`cred:${username}`, { ...cred, expiresAt: newExpiresAt }, { ex: ttlSeconds });
        break;
      }

      case 'customer.subscription.deleted': {
        // Subscription cancelled or payment retry window exhausted — revoke access.
        const sub      = event.data.object;
        const username = await kv.get(`sub:${sub.id}`);
        if (!username) break;

        await kv.del(`cred:${username}`);
        await kv.del(`sub:${sub.id}`);
        break;
      }

      // checkout.session.completed and invoice.payment_failed are acknowledged but not acted on:
      // - checkout.session.completed: handled by verify-session.js on the success page
      // - invoice.payment_failed: Stripe retries automatically; subscription.deleted fires if all retries fail
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err.message);
    // Still return 200 so Stripe doesn't retry — the event was received, the error is ours
  }

  return res.status(200).json({ received: true });
}
