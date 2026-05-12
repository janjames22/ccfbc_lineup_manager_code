import {
  allowMethods,
  debugPushServer,
  getRequestBody,
  getSupabaseAdmin,
  normalizeSubscription,
  upsertPushSubscription,
} from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    response.status(500).json({ error: 'Push subscription storage is not configured.' });
    return;
  }

  const subscription = normalizeSubscription(getRequestBody(request), request);
  if (!subscription.endpoint || !subscription.p256dh || !subscription.auth) {
    response.status(400).json({ error: 'Missing push subscription fields.' });
    return;
  }

  try {
    const saved = await upsertPushSubscription(supabase, subscription);
    debugPushServer('subscription saved to Supabase', { endpoint: saved.endpoint });
    response.status(200).json({ ok: true, endpoint: saved.endpoint });
  } catch (error) {
    console.error('[PushNotifications] failed to save push subscription:', error);
    response.status(500).json({ error: error.message || 'Unable to save push subscription.' });
  }
}
