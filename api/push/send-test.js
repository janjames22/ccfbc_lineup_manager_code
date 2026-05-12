import {
  allowMethods,
  createPushPayload,
  getRequestBody,
  getSupabaseAdmin,
  sendPushPayload,
} from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    response.status(500).json({ error: 'Push subscription storage is not configured.' });
    return;
  }

  const body = getRequestBody(request);
  const targetEndpoint = body.targetEndpoint || body.endpoint || '';
  const payload = createPushPayload({
    title: body.title || 'Line Up Manager',
    body: body.body || 'Test phone notification',
    url: body.url || '/lineups',
    tag: body.tag || 'lineup-manager-test',
    timestamp: new Date().toISOString(),
  });

  try {
    const result = await sendPushPayload(supabase, payload, { targetEndpoint });
    if (targetEndpoint && result.total === 0) {
      response.status(404).json({ ...result, error: 'No active push subscription found for this device.' });
      return;
    }

    response.status(200).json(result);
  } catch (error) {
    console.error('[PushNotifications] failed to send test push:', error);
    response.status(error.statusCode || 500).json({ error: error.message || 'Unable to send test notification.' });
  }
}
