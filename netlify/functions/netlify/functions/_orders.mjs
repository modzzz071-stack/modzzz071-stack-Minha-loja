
import { getStore } from '@netlify/blobs';

const orders = () => getStore('vault-orders');
const events = () => getStore('vault-events');

const kOrder = (id) => `order_${id}`;
const kSession = (sid) => `session_${sid}`;
const kEvent = (eid) => `evt_${eid}`;

export async function createOrder(order) {
  await orders().setJSON(kOrder(order.id), order);
}

export async function saveOrder(order) {
  await orders().setJSON(kOrder(order.id), order);
}

export async function getOrder(id) {
  return orders().getJSON(kOrder(id));
}

export async function indexSession(sessionId, orderId) {
  await orders().setJSON(kSession(sessionId), orderId);
}

export async function getOrderBySession(sessionId) {
  const orderId = await orders().get(kSession(sessionId), { type: 'text' });
  if (!orderId) return null;
  return getOrder(orderId.trim());
}

export async function eventSeen(eventId) {
  return (await events().get(kEvent(eventId), { type: 'text' })) !== null;
}

export async function recordEvent(eventId) {
  await events().set(kEvent(eventId), new Date().toISOString());
}
