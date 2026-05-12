import {
  allowMethods,
  createPushPayload,
  getRequestBody,
  getSupabaseAdmin,
  normalizeSubscription,
  sendPushPayload,
  sendPushPayloadToSubscriptions,
  validatePushSubscription,
} from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const body = getRequestBody(request);
  const supabase = getSupabaseAdmin();
  const targetEndpoint = body.targetEndpoint || body.endpoint || '';
  const payload = createPushPayload({
    title: body.title || 'Line Up Manager',
    body: body.body || 'Test phone notification',
    url: body.url || '/lineups',
    tag: body.tag || 'lineup-manager-test',
    timestamp: new Date().toISOString(),
  });

  try {
    let result;

    if (supabase) {
      result = await sendPushPayload(supabase, payload, { targetEndpoint });
    } else {
      const directSubscription = normalizeSubscription(body, request);
      const validationError = validatePushSubscription(directSubscription);
      if (validationError) {
        response.status(500).json({
          error: 'Push subscription storage is not configured. Add SUPABASE_SERVICE_ROLE_KEY on the server, or send a complete browser subscription for this device test.',
        });
        return;
      }

      result = await sendPushPayloadToSubscriptions(null, payload, [directSubscription]);
    }

    if (targetEndpoint && (result.totalSubscriptions ?? result.total ?? 0) === 0) {
      response.status(404).json({ ...result, error: 'No active push subscription found for this device.' });
      return;
    }

    response.status(200).json(result);
  } catch (error) {
    console.error('[PushNotifications] failed to send test push:', error);
    response.status(error.statusCode || 500).json({ error: error.message || 'Unable to send test notification.' });
  }
}
