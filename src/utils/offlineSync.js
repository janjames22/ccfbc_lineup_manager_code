export {
  getOfflineLineupById,
  getOfflineLineupIds,
  getOfflineLineupIdsSync,
  getOfflineLineupMeta,
  getOfflineLineupRecords,
  getOfflineLineups,
  getOfflineSongById,
  getOfflineSongIds,
  getOfflineSongIdsSync,
  getOfflineSongMeta,
  getOfflineSongRecords,
  getOfflineSongs,
  isLineupSavedOffline,
  isOfflineCopyOutdated,
  isSongSavedOffline,
  removeLineupOffline,
  removeSongOffline,
  saveLineupOffline,
  saveSongOffline,
  subscribeToOfflineItems,
} from '../lib/offlineStorage';

import { saveLineupOffline, saveSongOffline } from '../lib/offlineStorage';

export async function saveSongsOffline(songs) {
  if (!Array.isArray(songs)) return [];
  return Promise.all(songs.filter(Boolean).map((song) => saveSongOffline(song)));
}

export async function saveLineupsOffline(lineups) {
  if (!Array.isArray(lineups)) return [];
  return Promise.all(lineups.filter(Boolean).map((lineup) => saveLineupOffline(lineup)));
}
