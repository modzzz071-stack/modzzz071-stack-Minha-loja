
import { getOrderBySession } from './_orders.mjs';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export default async (req) => {
  if (req.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);

  const sessionId = new URL(req.url).searchParams.get('session_id');
  if (!sessionId || sessionId.length > 128) {
    return json({ error: 'missing_session_id' }, 400);
  }

  const order = await getOrderBySession(sessionId);
  if (!order) return json({ error: 'not_found' }, 404);

  const response = {
    status: order.status,
    order_id: order.id,
    total: order.total,
    currency: order.currency,
    email: order.customer_email,
  };

  if (order.status === 'paid') {
    const origin = new URL(req.url).origin;
    response.items = order.items.map((i) => ({
      id: i.id,
      name: i.name,
      qty: i.qty,
      download_url: `${origin}/.netlify/functions/download?order=${order.id}&item=${i.id}`,
    }));
  }

  return json(response);
};
