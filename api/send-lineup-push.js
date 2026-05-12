import {
  allowMethods,
  createPushPayload,
  formatLineupBody,
  getRequestBody,
  getSupabaseAdmin,
  loadLineup,
  sendPushPayload,
} from './_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    response.status(500).json({ error: 'Push subscription storage is not configured.' });
    return;
  }

  const { lineupId, url, excludeEndpoint, test, title, body, tag, targetEndpoint, endpoint } = getRequestBody(request);

  if (!lineupId && !test) {
    response.status(400).json({ error: 'Missing lineupId.' });
    return;
  }

  try {
    const payload = test
      ? createPushPayload({
          title: title || 'Line Up Manager',
          body: body || 'Test phone notification',
          url: url || '/lineups',
          tag: tag || 'lineup-manager-test',
          timestamp: new Date().toISOString(),
        })
      : createPushPayload({
          title: 'New lineup added',
          body: formatLineupBody(await loadLineup(supabase, lineupId)),
          url,
          lineupId,
          timestamp: new Date().toISOString(),
        });

    const result = await sendPushPayload(supabase, payload, {
      excludeEndpoint,
      targetEndpoint: targetEndpoint || endpoint || '',
    });

    response.status(200).json(result);
  } catch (error) {
    console.error('[PushNotifications] push send failed:', error.cause || error);
    response.status(error.statusCode || 500).json({ error: error.message || 'Unable to send push notification.' });
  }
}
