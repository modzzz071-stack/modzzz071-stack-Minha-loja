
import crypto from 'node:crypto';
import Stripe from 'stripe';
import { getProduct, LIMITS } from './_products.mjs';
import { createOrder, saveOrder, indexSession } from './_orders.mjs';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

function validateItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > LIMITS.MAX_DISTINCT_ITEMS) {
    return null;
  }
  const seen = new Set();
  const items = [];
  for (const entry of raw) {
    const id = entry?.id;
    const qty = entry?.qty;
    if (typeof id !== 'string' || id.length > 64 || seen.has(id)) return null;
    if (!Number.isInteger(qty) || qty < 1 || qty > LIMITS.MAX_QTY_PER_ITEM) return null;
    const product = getProduct(id);
    if (!product) return null;
    seen.add(id);
    items.push({ id, qty, price: product.price, name: product.name });
  }
  return items;
}

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) return json({ error: 'server_misconfigured' }, 500);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const items = validateItems(body?.items);
  if (!items) return json({ error: 'invalid_items' }, 400);

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const order = {
    id: crypto.randomUUID(),
    session_id: null,
    items,
    total,
    currency: 'brl',
    status: 'created',
    customer_email: null,
    amount_total: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    downloads: {},
  };
  await createOrder(order);

  const origin = new URL(req.url).origin;

  let session;
  try {
    const stripe = new Stripe(apiKey);
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: items.map((i) => ({
        quantity: i.qty,
        price_data: {
          currency: 'brl',
          unit_amount: i.price,
          product_data: { name: i.name },
        },
      })),
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=1`,
      metadata: { order_id: order.id },
    });
  } catch {
    return json({ error: 'stripe_unavailable' }, 502);
  }

  order.session_id = session.id;
  order.updated_at = new Date().toISOString();
  await saveOrder(order);
  await indexSession(session.id, order.id);

  return json({ url: session.url });
};
