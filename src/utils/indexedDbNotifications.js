const NOTIFICATIONS_DB_NAME = 'lineup-manager-notifications';
const NOTIFICATIONS_DB_VERSION = 1;
const METADATA_STORE = 'metadata';
const PENDING_PUSH_STORE = 'pendingPushNotifications';

export const NOTIFICATION_METADATA_KEYS = {
  unreadCount: 'unreadCount',
  lastPushReceivedAt: 'lastPushReceivedAt',
  lastBadgeSyncAt: 'lastBadgeSyncAt',
  latestNotificationId: 'latestNotificationId',
  latestLineupId: 'latestLineupId',
};

function supportsIndexedDb() {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

function openNotificationsDb() {
  return new Promise((resolve, reject) => {
    if (!supportsIndexedDb()) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = window.indexedDB.open(NOTIFICATIONS_DB_NAME, NOTIFICATIONS_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(METADATA_STORE)) {
        db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(PENDING_PUSH_STORE)) {
        db.createObjectStore(PENDING_PUSH_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function normalizeUnreadCount(count) {
  return Math.max(0, Number(count) || 0);
}

export async function getMetadata(key) {
  const db = await openNotificationsDb();
  try {
    const transaction = db.transaction(METADATA_STORE, 'readonly');
    const record = await requestToPromise(transaction.objectStore(METADATA_STORE).get(key));
    return record?.value ?? null;
  } finally {
    db.close();
  }
}

export async function setMetadata(key, value) {
  const db = await openNotificationsDb();
  try {
    const transaction = db.transaction(METADATA_STORE, 'readwrite');
    transaction.objectStore(METADATA_STORE).put({
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
    await transactionDone(transaction);
    return value;
  } finally {
    db.close();
  }
}

export async function getUnreadCount() {
  return normalizeUnreadCount(await getMetadata(NOTIFICATION_METADATA_KEYS.unreadCount));
}

export async function setUnreadCount(count) {
  return setMetadata(NOTIFICATION_METADATA_KEYS.unreadCount, normalizeUnreadCount(count));
}

export async function incrementUnreadCount() {
  const nextCount = (await getUnreadCount()) + 1;
  await setUnreadCount(nextCount);
  return nextCount;
}

export async function decrementUnreadCount() {
  const nextCount = normalizeUnreadCount((await getUnreadCount()) - 1);
  await setUnreadCount(nextCount);
  return nextCount;
}

export async function clearUnreadCount() {
  await setUnreadCount(0);
  return 0;
}

export async function readPendingLineupPushNotifications() {
  const db = await openNotificationsDb();
  try {
    const transaction = db.transaction(PENDING_PUSH_STORE, 'readonly');
    const notifications = await requestToPromise(transaction.objectStore(PENDING_PUSH_STORE).getAll());
    return Array.isArray(notifications) ? notifications : [];
  } finally {
    db.close();
  }
}

export async function removePendingLineupPushNotifications(ids = []) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return;

  const db = await openNotificationsDb();
  try {
    const transaction = db.transaction(PENDING_PUSH_STORE, 'readwrite');
    const store = transaction.objectStore(PENDING_PUSH_STORE);
    uniqueIds.forEach((id) => store.delete(id));
    await transactionDone(transaction);
  } finally {
    db.close();
  }
}
