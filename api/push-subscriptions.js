import {
  allowMethods,
  getRequestBody,
  getSupabaseAdmin,
  getSupabaseConfigStatus,
  getSupabasePublicWriteClient,
  MISSING_COLUMN_CODES,
  normalizeSubscription,
  upsertPushSubscription,
  validatePushSubscription,
} from './_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabaseAdmin = getSupabaseAdmin();
  const supabase = supabaseAdmin || getSupabasePublicWriteClient();
  if (!supabase) {
    const config = getSupabaseConfigStatus();
    response.status(500).json({ error: config.reason || 'Push subscription storage is not configured.' });
    return;
  }

  const subscription = normalizeSubscription(getRequestBody(request), request);
  const validationError = validatePushSubscription(subscription);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }

  try {
    const saved = await upsertPushSubscription(supabase, subscription, { selectResult: Boolean(supabaseAdmin) });
    response.status(200).json({ ok: true, endpoint: saved.endpoint, verified: Boolean(supabaseAdmin) });
  } catch (error) {
    console.error('[PushNotifications] failed to save push subscription:', error);
    if (MISSING_COLUMN_CODES.has(error.code)) {
      response.status(500).json({ error: 'push_subscriptions table missing or outdated. Apply supabase-schema.sql in Supabase.' });
      return;
    }

    response.status(500).json({ error: `Subscription save failed: ${error.message || 'Unable to save push subscription.'}` });
  }
}
