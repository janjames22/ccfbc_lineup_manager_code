import {
  NOTIFICATION_METADATA_KEYS,
  readPendingLineupPushNotifications,
  removePendingLineupPushNotifications,
  setMetadata,
  setUnreadCount,
} from './indexedDbNotifications';

const IS_DEV = import.meta.env.DEV;

function debugBadge(message, details) {
  if (!IS_DEV) return;
  if (typeof details === 'undefined') {
    console.log(`[AppBadge] ${message}`);
    return;
  }
  console.log(`[AppBadge] ${message}`, details);
}

async function postBadgeCountToServiceWorker(count) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller || registration?.active || registration?.waiting || registration?.installing;
    worker?.postMessage({
      type: 'LINEUP_BADGE_SYNC',
      count,
    });
  } catch (error) {
    debugBadge('could not sync badge count to service worker', error);
  }
}

export async function setLineupAppBadge(count, { syncServiceWorker = true } = {}) {
  const normalizedCount = Math.max(0, Number(count) || 0);

  if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
    try {
      if (normalizedCount > 0) {
        await navigator.setAppBadge(normalizedCount);
      } else if ('clearAppBadge' in navigator) {
        await navigator.clearAppBadge();
      } else {
        await navigator.setAppBadge(0);
      }
      debugBadge('app badge updated', { count: normalizedCount });
    } catch (error) {
      debugBadge('app badge update was blocked or unsupported', error);
    }
  }

  try {
    await setUnreadCount(normalizedCount);
    await setMetadata(NOTIFICATION_METADATA_KEYS.lastBadgeSyncAt, new Date().toISOString());
  } catch (error) {
    debugBadge('could not persist badge metadata', error);
  }

  if (syncServiceWorker) await postBadgeCountToServiceWorker(normalizedCount);
}

export {
  readPendingLineupPushNotifications,
  removePendingLineupPushNotifications,
};
