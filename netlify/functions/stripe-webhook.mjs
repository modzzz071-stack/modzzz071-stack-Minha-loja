
import Stripe from 'stripe';
import { getOrder, saveOrder, eventSeen, recordEvent } from './_orders.mjs';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!secret || !apiKey) return json({ error: 'server_misconfigured' }, 500);

  const signature = req.headers.get('stripe-signature');
  if (!signature) return json({ error: 'missing_signature' }, 400);

  const payload = await req.text();

  let event;
  try {
    event = new Stripe(apiKey).webhooks.constructEvent(payload, signature, secret);
  } catch {
    return json({ error: 'invalid_signature' }, 400);
  }

  if (await eventSeen(event.id)) {
    return json({ received: true, duplicate: true });
  }
  await recordEvent(event.id);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (orderId && session.payment_status === 'paid') {
      const order = await getOrder(orderId);
      if (order && order.status !== 'paid') {
        order.status = 'paid';
        order.customer_email = session.customer_details?.email ?? null;
        order.amount_total = session.amount_total ?? null;
        order.currency = session.currency ?? order.currency;
        order.updated_at = new Date().toISOString();
        await saveOrder(order);
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      const order = await getOrder(orderId);
      if (order && order.status === 'created') {
        order.status = 'expired';
        order.updated_at = new Date().toISOString();
        await saveOrder(order);
      }
    }
  }

  return json({ received: true });
};
