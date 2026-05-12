import {
  allowMethods,
  createPushPayload,
  formatLineupBody,
  getRequestBody,
  getSupabaseAdmin,
  loadLineup,
  sendPushPayload,
} from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['POST'])) return;

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    response.status(500).json({ error: 'Push subscription storage is not configured.' });
    return;
  }

  const { lineupId, url, excludeEndpoint } = getRequestBody(request);
  if (!lineupId) {
    response.status(400).json({ error: 'Missing lineupId.' });
    return;
  }

  try {
    const lineup = await loadLineup(supabase, lineupId);
    const payload = createPushPayload({
      title: 'New lineup added',
      body: formatLineupBody(lineup),
      url: url || `/lineups/${lineup.id}`,
      lineupId: lineup.id,
      timestamp: new Date().toISOString(),
    });
    const result = await sendPushPayload(supabase, payload, { excludeEndpoint });
    response.status(200).json(result);
  } catch (error) {
    console.error('[PushNotifications] failed to send lineup push:', error.cause || error);
    response.status(error.statusCode || 500).json({ error: error.message || 'Unable to send lineup push notification.' });
  }
}
