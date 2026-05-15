import { openDB } from 'idb';

const DB_NAME = 'worship-app-db';
const DB_VERSION = 2;
const LEGACY_SONGS_STORE = 'songs';
const LEGACY_LINEUPS_STORE = 'lineups';
const OFFLINE_SONGS_STORE = 'offlineSongs';
const OFFLINE_LINEUPS_STORE = 'offlineLineups';
const OFFLINE_IDS_KEY = 'worshipOfflineItemIds';
const OFFLINE_FALLBACK_KEY = 'worshipOfflineItems';
const OFFLINE_MIGRATION_KEY = 'worshipOfflineMigrationV2';
export const OFFLINE_ITEMS_CHANGE_EVENT = 'worship-offline-items-change';

let dbPromise = null;
let migrationPromise = null;

const STORE_CONFIG = {
  song: {
    storeName: OFFLINE_SONGS_STORE,
    legacyStoreName: LEGACY_SONGS_STORE,
    fallbackKey: 'songs',
    idsKey: 'songIds',
  },
  lineup: {
    storeName: OFFLINE_LINEUPS_STORE,
    legacyStoreName: LEGACY_LINEUPS_STORE,
    fallbackKey: 'lineups',
    idsKey: 'lineupIds',
  },
};

function getNow() {
  return new Date().toISOString();
}

function isBrowser() {
  return typeof window !== 'undefined';
}

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function readJson(key, fallback) {
  if (!isBrowser()) return fallback;
  return safeParse(window.localStorage.getItem(key), fallback);
}

function writeJson(key, value) {
  if (!isBrowser()) return value;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[OfflineStorage] Failed to write ${key}:`, error);
  }
  return value;
}

function readFallbackState() {
  return readJson(OFFLINE_FALLBACK_KEY, { songs: {}, lineups: {} });
}

function writeFallbackState(nextState) {
  return writeJson(OFFLINE_FALLBACK_KEY, {
    songs: nextState?.songs && typeof nextState.songs === 'object' ? nextState.songs : {},
    lineups: nextState?.lineups && typeof nextState.lineups === 'object' ? nextState.lineups : {},
  });
}

function readIdsState() {
  return readJson(OFFLINE_IDS_KEY, { songIds: [], lineupIds: [] });
}

function writeIdsState(nextState) {
  return writeJson(OFFLINE_IDS_KEY, {
    songIds: Array.isArray(nextState?.songIds) ? nextState.songIds : [],
    lineupIds: Array.isArray(nextState?.lineupIds) ? nextState.lineupIds : [],
  });
}

function emitOfflineItemsChange(detail = {}) {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(OFFLINE_ITEMS_CHANGE_EVENT, { detail }));
}

function normalizeRecord(item, existingRecord = null) {
  const id = item?.id;
  if (!id) throw new Error('Offline item needs an id.');

  const now = getNow();
  return {
    id,
    item,
    savedAt: now,
    firstSavedAt: existingRecord?.firstSavedAt || existingRecord?.savedAt || now,
    itemUpdatedAt: item?.updatedAt || item?.updated_at || '',
    updatedAt: now,
  };
}

function getItemFromRecord(record) {
  if (!record) return null;
  return record.item || record.payload || record;
}

function getConfig(type) {
  const config = STORE_CONFIG[type];
  if (!config) throw new Error(`Unsupported offline item type: ${type}`);
  return config;
}

async function getDB() {
  if (!isBrowser() || !('indexedDB' in window)) return null;

  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(LEGACY_SONGS_STORE)) {
          db.createObjectStore(LEGACY_SONGS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(LEGACY_LINEUPS_STORE)) {
          db.createObjectStore(LEGACY_LINEUPS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(OFFLINE_SONGS_STORE)) {
          db.createObjectStore(OFFLINE_SONGS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(OFFLINE_LINEUPS_STORE)) {
          db.createObjectStore(OFFLINE_LINEUPS_STORE, { keyPath: 'id' });
        }
      },
    }).catch((error) => {
      console.error('[OfflineStorage] Failed to open IndexedDB:', error);
      return null;
    });
  }

  const db = await dbPromise;
  if (db) await migrateLegacyOfflineStores(db);
  return db;
}

async function migrateLegacyOfflineStores(db) {
  if (!db || !isBrowser()) return;
  if (window.localStorage.getItem(OFFLINE_MIGRATION_KEY) === 'done') return;
  if (!migrationPromise) {
    migrationPromise = (async () => {
      for (const type of Object.keys(STORE_CONFIG)) {
        const config = getConfig(type);
        if (!db.objectStoreNames.contains(config.legacyStoreName)) continue;
        if (!db.objectStoreNames.contains(config.storeName)) continue;

        const existingRecords = await db.getAll(config.storeName);
        if (existingRecords.length > 0) continue;

        const legacyItems = await db.getAll(config.legacyStoreName);
        if (!legacyItems.length) continue;

        const tx = db.transaction(config.storeName, 'readwrite');
        for (const legacyItem of legacyItems) {
          if (!legacyItem?.id) continue;
          tx.store.put(normalizeRecord(legacyItem));
        }
        await tx.done;
      }

      await syncAllIdCaches(db);
      window.localStorage.setItem(OFFLINE_MIGRATION_KEY, 'done');
    })().catch((error) => {
      console.error('[OfflineStorage] Legacy offline migration failed:', error);
    });
  }

  await migrationPromise;
}

async function syncIdCache(type, db) {
  const config = getConfig(type);
  const idsState = readIdsState();
  let ids = [];

  if (db && db.objectStoreNames.contains(config.storeName)) {
    ids = (await db.getAllKeys(config.storeName)).map(String);
  } else {
    const fallbackState = readFallbackState();
    ids = Object.keys(fallbackState[config.fallbackKey] || {});
  }

  writeIdsState({
    ...idsState,
    [config.idsKey]: ids,
  });
  return ids;
}

async function syncAllIdCaches(db) {
  await Promise.all([
    syncIdCache('song', db),
    syncIdCache('lineup', db),
  ]);
}

async function getRecord(type, id) {
  if (!id) return null;
  const config = getConfig(type);
  const db = await getDB();

  if (db && db.objectStoreNames.contains(config.storeName)) {
    return db.get(config.storeName, id);
  }

  const fallbackState = readFallbackState();
  return fallbackState[config.fallbackKey]?.[id] || null;
}

async function getRecords(type) {
  const config = getConfig(type);
  const db = await getDB();

  if (db && db.objectStoreNames.contains(config.storeName)) {
    const records = await db.getAll(config.storeName);
    await syncIdCache(type, db);
    return records;
  }

  const fallbackState = readFallbackState();
  return Object.values(fallbackState[config.fallbackKey] || {});
}

async function saveOfflineItem(type, item) {
  const config = getConfig(type);
  const existingRecord = item?.id ? await getRecord(type, item.id) : null;
  const record = normalizeRecord(item, existingRecord);
  const db = await getDB();

  if (db && db.objectStoreNames.contains(config.storeName)) {
    await db.put(config.storeName, record);
    await syncIdCache(type, db);
  } else {
    const fallbackState = readFallbackState();
    writeFallbackState({
      ...fallbackState,
      [config.fallbackKey]: {
        ...(fallbackState[config.fallbackKey] || {}),
        [record.id]: record,
      },
    });
    await syncIdCache(type, null);
  }

  emitOfflineItemsChange({ type, action: 'save', id: record.id });
  return getItemFromRecord(record);
}

async function removeOfflineItem(type, id) {
  if (!id) return false;
  const config = getConfig(type);
  const db = await getDB();

  if (db && db.objectStoreNames.contains(config.storeName)) {
    await db.delete(config.storeName, id);
    await syncIdCache(type, db);
  } else {
    const fallbackState = readFallbackState();
    const nextTypeState = { ...(fallbackState[config.fallbackKey] || {}) };
    delete nextTypeState[id];
    writeFallbackState({
      ...fallbackState,
      [config.fallbackKey]: nextTypeState,
    });
    await syncIdCache(type, null);
  }

  emitOfflineItemsChange({ type, action: 'remove', id });
  return true;
}

async function isSavedOffline(type, id) {
  return Boolean(await getRecord(type, id));
}

async function getSavedIds(type) {
  const db = await getDB();
  return syncIdCache(type, db);
}

function getSavedIdsSync(type) {
  const config = getConfig(type);
  const idsState = readIdsState();
  return Array.isArray(idsState[config.idsKey]) ? idsState[config.idsKey] : [];
}

export function subscribeToOfflineItems(listener) {
  if (!isBrowser()) return () => {};
  window.addEventListener(OFFLINE_ITEMS_CHANGE_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(OFFLINE_ITEMS_CHANGE_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
}

export async function isSongSavedOffline(songId) {
  return isSavedOffline('song', songId);
}

export async function saveSongOffline(song) {
  return saveOfflineItem('song', song);
}

export async function removeSongOffline(songId) {
  return removeOfflineItem('song', songId);
}

export async function getOfflineSongs() {
  const records = await getRecords('song');
  return records.map(getItemFromRecord).filter(Boolean);
}

export async function getOfflineSongById(songId) {
  return getItemFromRecord(await getRecord('song', songId));
}

export async function getOfflineSongRecords() {
  return getRecords('song');
}

export async function getOfflineSongIds() {
  return getSavedIds('song');
}

export function getOfflineSongIdsSync() {
  return getSavedIdsSync('song');
}

export async function getOfflineSongMeta(songId) {
  const record = await getRecord('song', songId);
  if (!record) return null;
  const { item: _item, payload: _payload, ...meta } = record;
  return meta;
}

export async function isLineupSavedOffline(lineupId) {
  return isSavedOffline('lineup', lineupId);
}

export async function saveLineupOffline(lineup) {
  return saveOfflineItem('lineup', lineup);
}

export async function removeLineupOffline(lineupId) {
  return removeOfflineItem('lineup', lineupId);
}

export async function getOfflineLineups() {
  const records = await getRecords('lineup');
  return records.map(getItemFromRecord).filter(Boolean);
}

export async function getOfflineLineupById(lineupId) {
  return getItemFromRecord(await getRecord('lineup', lineupId));
}

export async function getOfflineLineupRecords() {
  return getRecords('lineup');
}

export async function getOfflineLineupIds() {
  return getSavedIds('lineup');
}

export function getOfflineLineupIdsSync() {
  return getSavedIdsSync('lineup');
}

export async function getOfflineLineupMeta(lineupId) {
  const record = await getRecord('lineup', lineupId);
  if (!record) return null;
  const { item: _item, payload: _payload, ...meta } = record;
  return meta;
}

export function isOfflineCopyOutdated(item, meta) {
  if (!item?.updatedAt || !meta?.itemUpdatedAt) return false;
  return String(item.updatedAt) !== String(meta.itemUpdatedAt);
}
