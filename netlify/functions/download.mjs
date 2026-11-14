
import { getStore } from '@netlify/blobs';
import { getOrder, saveOrder } from './_orders.mjs';
import { getProduct } from './_products.mjs';

const MAX_DOWNLOADS_PER_ITEM = 5;

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

export default async (req) => {
  const url = new URL(req.url);
  const orderId = url.searchParams.get('order');
  const itemId = url.searchParams.get('item');
  if (!orderId || !itemId) return json({ error: 'missing_params' }, 400);

  const order = await getOrder(orderId);
  if (!order || order.status !== 'paid') return json({ error: 'not_paid' }, 403);

  const item = order.items.find((i) => i.id === itemId);
  if (!item) return json({ error: 'item_not_in_order' }, 403);

  const used = order.downloads?.[itemId] ?? 0;
  if (used >= MAX_DOWNLOADS_PER_ITEM) return json({ error: 'download_limit_reached' }, 403);

  const source = getProduct(itemId)?.file;
  if (!source) return json({ error: 'delivery_not_configured' }, 404);

  order.downloads = { ...order.downloads, [itemId]: used + 1 };
  order.updated_at = new Date().toISOString();
  await saveOrder(order);

  if (source.type === 'url') {
    return Response.redirect(source.url, 302);
  }

  const files = getStore('vault-product-files');
  const entry = await files.getWithMetadata(source.key);
  if (!entry?.data) return json({ error: 'file_missing' }, 404);

  const filename = entry.metadata?.filename ?? itemId;
  return new Response(entry.data, {
    headers: {
      'content-type': entry.metadata?.contentType ?? 'application/octet-stream',
      'content-disposition': `attachment; filename="${filename}"`,
      'cache-control': 'no-store',
    },
  });
};
