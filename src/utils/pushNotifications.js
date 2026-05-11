import { isSupabaseConfigured } from './supabase';

const PUSH_SUBSCRIPTION_ENDPOINT_KEY = 'lineupManagerPushSubscriptionEndpoint';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isIosDevice() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function getPushSupportStatus() {
  const permission = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission;
  const supported = typeof window !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window
    && Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);

  return {
    supported,
    permission,
    isIos: isIosDevice(),
    isStandalone: isStandalonePwa(),
  };
}

function getSubscriptionKeys(subscription) {
  const json = subscription.toJSON();
  return {
    endpoint: subscription.endpoint,
    p256dh: json.keys?.p256dh || '',
    auth: json.keys?.auth || '',
  };
}

export function getStoredPushSubscriptionEndpoint() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY) || '';
}

function storePushSubscriptionEndpoint(endpoint) {
  if (typeof window === 'undefined' || !endpoint) return;
  window.localStorage.setItem(PUSH_SUBSCRIPTION_ENDPOINT_KEY, endpoint);
}

async function saveSubscription(subscription) {
  const keys = getSubscriptionKeys(subscription);
  if (!keys.endpoint || !keys.p256dh || !keys.auth) {
    throw new Error('Browser did not return a complete push subscription.');
  }

  const response = await fetch('/api/push-subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: keys.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: navigator.userAgent || '',
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Unable to save push subscription.');
  }

  storePushSubscriptionEndpoint(keys.endpoint);
  return keys;
}

export async function subscribeToLineupPushNotifications() {
  const support = getPushSupportStatus();
  if (!support.supported) {
    throw new Error('Phone notifications are not supported in this browser or VITE_VAPID_PUBLIC_KEY is missing.');
  }

  if (support.isIos && !support.isStandalone) {
    throw new Error('For iPhone/iPad idle notifications, install this app to Home Screen first, then enable notifications.');
  }

  if (!isSupabaseConfigured()) {
    throw new Error('Supabase must be configured before phone notifications can be saved.');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(permission === 'denied' ? 'Permission denied.' : 'Permission was not granted.');
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
  });

  await saveSubscription(subscription);

  return {
    message: 'Phone notifications enabled for this device.',
    subscription,
  };
}

export async function sendLineupPushNotification(lineup) {
  if (!lineup?.id) return;

  const targetUrl = `/lineups/${lineup.id}`;
  const response = await fetch('/api/send-lineup-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lineupId: lineup.id,
      url: targetUrl,
      excludeEndpoint: getStoredPushSubscriptionEndpoint(),
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Unable to send lineup push notification.');
  }
}
