import {
  allowMethods,
  deletePushSubscription,
  getRequestBody,
  getSupabaseAdmin,
} from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    response.status(500).json({ error: 'Push subscription storage is not configured.' });
    return;
  }

  const { endpoint } = getRequestBody(request);
  if (!endpoint) {
    response.status(400).json({ error: 'Missing push subscription endpoint.' });
    return;
  }

  try {
    await deletePushSubscription(supabase, endpoint);
    response.status(200).json({ ok: true });
  } catch (error) {
    console.error('[PushNotifications] failed to remove push subscription:', error);
    response.status(500).json({ error: error.message || 'Unable to remove push subscription.' });
  }
}
