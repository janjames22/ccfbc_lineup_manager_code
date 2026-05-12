import {
  allowMethods,
  deactivatePushSubscription,
  deletePushSubscription,
  getRequestBody,
  getSupabaseAdmin,
  getSupabasePublicWriteClient,
} from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabaseAdmin = getSupabaseAdmin();
  const supabase = supabaseAdmin || getSupabasePublicWriteClient();
  if (!supabase) {
    response.status(500).json({
      error: 'Push subscription storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY on the server.',
    });
    return;
  }

  const { endpoint } = getRequestBody(request);
  if (!endpoint) {
    response.status(400).json({ error: 'Missing push subscription endpoint.' });
    return;
  }

  try {
    if (supabaseAdmin) {
      await deletePushSubscription(supabase, endpoint);
    } else {
      await deactivatePushSubscription(supabase, endpoint);
    }
    response.status(200).json({ ok: true });
  } catch (error) {
    console.error('[PushNotifications] failed to remove push subscription:', error);
    response.status(500).json({ error: error.message || 'Unable to remove push subscription.' });
  }
}
