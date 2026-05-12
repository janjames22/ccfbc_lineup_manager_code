import { allowMethods, getVapidPublicKey } from '../_push.js';

export default async function handler(request, response) {
  if (!allowMethods(request, response, ['GET'])) return;

  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    response.status(500).json({ error: 'Web Push public key is not configured.' });
    return;
  }

  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({ publicKey });
}
