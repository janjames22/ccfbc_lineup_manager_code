import {
  allowMethods,
  getRequestBody,
  getSupabaseAdmin,
  getSupabaseConfigStatus,
  MISSING_COLUMN_CODES,
} from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const config = getSupabaseConfigStatus();
    response.status(200).json({
      ok: true,
      saved: null,
      active: null,
      checkUnavailable: true,
      error: config.ok
        ? 'Subscription verification requires SUPABASE_SERVICE_ROLE_KEY on the server.'
        : config.reason,
    });
    return;
  }

  const { endpoint } = getRequestBody(request);
  if (!endpoint) {
    response.status(400).json({ error: 'Missing push subscription endpoint.' });
    return;
  }

  let { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint,is_active,last_seen_at,updated_at,device_id')
    .eq('endpoint', endpoint)
    .maybeSingle();

  if (error && MISSING_COLUMN_CODES.has(error.code)) {
    const fallback = await supabase
      .from('push_subscriptions')
      .select('endpoint,is_active,last_seen_at,updated_at')
      .eq('endpoint', endpoint)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error('[PushNotifications] failed to check push subscription:', error);
    if (MISSING_COLUMN_CODES.has(error.code)) {
      response.status(500).json({ error: 'push_subscriptions table missing or outdated. Apply supabase-schema.sql in Supabase.' });
      return;
    }

    response.status(500).json({ error: error.message || 'Unable to check push subscription.' });
    return;
  }

  response.status(200).json({
    ok: true,
    saved: Boolean(data?.endpoint),
    active: Boolean(data?.endpoint) && data?.is_active !== false,
    endpoint: data?.endpoint || endpoint,
    deviceId: data?.device_id || '',
    lastSeenAt: data?.last_seen_at || null,
    updatedAt: data?.updated_at || null,
  });
}
