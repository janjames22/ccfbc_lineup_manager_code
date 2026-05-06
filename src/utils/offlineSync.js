import { openDB } from 'idb';

const DB_NAME = 'worship-app-db';
const DB_VERSION = 1;

let dbPromise = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('songs')) {
          db.createObjectStore('songs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('lineups')) {
          db.createObjectStore('lineups', { keyPath: 'id' });
        }
      },
    }).catch(err => {
      console.error('Failed to open IndexedDB:', err);
      return null;
    });
  }
  return dbPromise;
}

export async function saveSongsOffline(songs) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('songs', 'readwrite');
  for (const song of songs) {
    tx.store.put(song);
  }
  await tx.done;
  console.log('Saved songs for offline use');
}

export async function getOfflineSongs() {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll('songs');
}

export async function saveLineupsOffline(lineups) {
  const db = await getDB();
  if (!db) return;
  const tx = db.transaction('lineups', 'readwrite');
  for (const lineup of lineups) {
    tx.store.put(lineup);
  }
  await tx.done;
  console.log('Saved lineups for offline use');
}

export async function getOfflineLineups() {
  const db = await getDB();
  if (!db) return [];
  return await db.getAll('lineups');
}
