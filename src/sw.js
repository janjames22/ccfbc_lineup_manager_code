/// <reference lib="webworker" />
/* global __APP_BUILD_VERSION__, clients */

import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

const BUILD_VERSION = typeof __APP_BUILD_VERSION__ === 'string' ? __APP_BUILD_VERSION__ : 'dev';
const CACHE_PREFIX = 'lineup-manager';
const PRECACHE_SUFFIX = `precache-${BUILD_VERSION}`;
const RUNTIME_SUFFIX = `runtime-${BUILD_VERSION}`;
const APP_SHELL_CACHE = `${CACHE_PREFIX}-app-shell-${BUILD_VERSION}`;
const STATIC_ASSET_CACHE = `${CACHE_PREFIX}-assets-${BUILD_VERSION}`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-${BUILD_VERSION}`;
const CACHE_PREFIXES_TO_CLEAN = ['lineup-manager', 'workbox-precache', 'workbox-runtime'];
const IS_DEV_HOST = ['localhost', '127.0.0.1', '[::1]'].includes(self.location.hostname);
const IS_DEV_BUILD = BUILD_VERSION === 'dev' || IS_DEV_HOST;

function debugPush(message, details) {
  if (!IS_DEV_BUILD) return;
  if (typeof details === 'undefined') {
    console.log(`[PushNotifications] ${message}`);
    return;
  }
  console.log(`[PushNotifications] ${message}`, details);
}

function readPushPayload(event) {
  if (!event.data) return {};

  try {
    return event.data.json();
  } catch (jsonError) {
    try {
      return { body: event.data.text() };
    } catch (textError) {
      console.warn('[PushNotifications] push payload could not be parsed', { jsonError, textError });
      return {};
    }
  }
}

function getNotificationUrl(payload = {}) {
  const fallbackUrl = payload.lineupId ? `/lineups/${payload.lineupId}` : '/lineups';
  const rawUrl = payload.url || payload.data?.url || fallbackUrl;
  return new URL(rawUrl, self.location.origin).href;
}

function createNotificationOptions(payload = {}) {
  const lineupId = payload.lineupId || payload.lineup_id || payload.data?.lineupId || null;
  const url = getNotificationUrl({ ...payload, lineupId });
  const timestampValue = payload.timestamp ? Date.parse(payload.timestamp) : Date.now();
  const timestamp = Number.isFinite(timestampValue) ? timestampValue : Date.now();

  return {
    body: payload.body || 'New notification',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || (lineupId ? `lineup-${lineupId}` : 'lineup-manager'),
    timestamp,
    renotify: payload.renotify !== false,
    requireInteraction: payload.requireInteraction === true,
    vibrate: [200, 100, 200],
    data: {
      ...(payload.data || {}),
      url,
      lineupId,
      timestamp,
    },
  };
}

async function focusOrOpenNotificationUrl(urlToOpen, notificationData = {}) {
  const targetUrl = new URL(urlToOpen, self.location.origin);
  const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });

  for (const client of clientList) {
    const clientUrl = new URL(client.url);
    if (clientUrl.origin !== self.location.origin) continue;

    let targetClient = client;
    if ('navigate' in targetClient) {
      targetClient = await targetClient.navigate(targetUrl.href) || targetClient;
    }

    if ('focus' in targetClient) {
      await targetClient.focus();
    }

    targetClient.postMessage?.({
      type: 'LINEUP_NOTIFICATION_CLICK',
      lineupId: notificationData.lineupId || null,
      url: `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`,
    });

    return;
  }

  if (clients.openWindow) {
    await clients.openWindow(targetUrl.href);
  }
}

setCacheNameDetails({
  prefix: CACHE_PREFIX,
  precache: 'precache',
  runtime: 'runtime',
  suffix: BUILD_VERSION,
});

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

const appShellHandler = createHandlerBoundToURL('index.html');
const navigationHandler = new NetworkFirst({
  cacheName: APP_SHELL_CACHE,
  networkTimeoutSeconds: 3,
  plugins: [
    new CacheableResponsePlugin({
      statuses: [200],
    }),
    new ExpirationPlugin({
      maxEntries: 10,
      purgeOnQuotaError: true,
    }),
  ],
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    console.log('[PWA] activating new service worker', { buildVersion: BUILD_VERSION });
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const cachesToDelete = cacheNames.filter((cacheName) => {
        if (!CACHE_PREFIXES_TO_CLEAN.some((prefix) => cacheName.startsWith(prefix))) return false;
        return !cacheName.includes(BUILD_VERSION);
      });

      await Promise.all(cachesToDelete.map((cacheName) => caches.delete(cacheName)));
      console.log('[PWA] old caches deleted', {
        buildVersion: BUILD_VERSION,
        deletedCaches: cachesToDelete,
        activeCaches: [PRECACHE_SUFFIX, RUNTIME_SUFFIX, APP_SHELL_CACHE, STATIC_ASSET_CACHE, IMAGE_CACHE],
      });
      await self.clients.claim();
    })()
  );
});

self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  const title = payload.title || 'Line Up Manager';
  const options = createNotificationOptions(payload);

  debugPush('push event received', { title, options });

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification.data || {};
  const urlToOpen = notificationData.url || '/lineups';

  debugPush('notification click URL', { url: urlToOpen, lineupId: notificationData.lineupId });

  event.waitUntil(focusOrOpenNotificationUrl(urlToOpen, notificationData));
});

self.addEventListener('notificationclose', (event) => {
  debugPush('notification closed', {
    tag: event.notification.tag,
    lineupId: event.notification.data?.lineupId || null,
  });
});

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await navigationHandler.handle({ event, request: event.request });
    } catch (error) {
      console.warn('[PWA] navigation network request failed, using cached app shell fallback', error);
      return appShellHandler({ event, request: event.request });
    }
  }
);

registerRoute(
  ({ request, url }) =>
    ['script', 'style', 'worker'].includes(request.destination) && url.origin === self.location.origin,
  new StaleWhileRevalidate({
    cacheName: STATIC_ASSET_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 64,
        maxAgeSeconds: 7 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

registerRoute(
  ({ request, url }) => request.destination === 'image' && url.origin === self.location.origin,
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [200],
      }),
      new ExpirationPlugin({
        maxEntries: 48,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true,
      }),
    ],
  })
);
