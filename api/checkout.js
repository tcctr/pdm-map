import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  '72h':      process.env.STRIPE_PRICE_72H,
  'monthly':  process.env.STRIPE_PRICE_MONTHLY,
  'lifetime': process.env.STRIPE_PRICE_LIFETIME,
};

// monthly is a recurring subscription; the other two are one-time payments
const MODES = {
  '72h':      'payment',
  'monthly':  'subscription',
  'lifetime': 'payment',
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { plan } = req.body ?? {};

  if (!plan || !PRICE_IDS[plan]) {
    return res.status(400).json({ error: 'Unknown plan' });
  }

  if (!PRICE_IDS[plan]) {
    return res.status(500).json({ error: `Price ID for plan "${plan}" is not configured` });
  }

  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host  = req.headers['x-forwarded-host'] || req.headers.host;
  const base  = `${proto}://${host}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: MODES[plan],
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${base}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${base}/#pricing`,
      metadata: { plan },
      ...(MODES[plan] === 'subscription' && {
        subscription_data: { metadata: { plan } },
      }),
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err.message);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
