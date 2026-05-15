import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getOfflineLineupIds,
  getOfflineLineupIdsSync,
  getOfflineLineupRecords,
  getOfflineSongIds,
  getOfflineSongIdsSync,
  getOfflineSongRecords,
  isOfflineCopyOutdated,
  removeLineupOffline,
  removeSongOffline,
  saveLineupOffline,
  saveSongOffline,
  subscribeToOfflineItems,
} from '../lib/offlineStorage';

const CONFIG = {
  song: {
    getIds: getOfflineSongIds,
    getIdsSync: getOfflineSongIdsSync,
    getRecords: getOfflineSongRecords,
    save: saveSongOffline,
    remove: removeSongOffline,
  },
  lineup: {
    getIds: getOfflineLineupIds,
    getIdsSync: getOfflineLineupIdsSync,
    getRecords: getOfflineLineupRecords,
    save: saveLineupOffline,
    remove: removeLineupOffline,
  },
};

function metaFromRecord(record) {
  if (!record?.id) return null;
  const { item: _item, payload: _payload, ...meta } = record;
  return meta;
}

export function useOfflineItems(type) {
  const config = CONFIG[type];
  if (!config) throw new Error(`Unsupported offline item type: ${type}`);

  const [ids, setIds] = useState(() => config.getIdsSync());
  const [metaById, setMetaById] = useState({});
  const [busyIds, setBusyIds] = useState([]);

  const refresh = useCallback(async () => {
    const [nextIds, records] = await Promise.all([
      config.getIds(),
      config.getRecords(),
    ]);
    const nextMetaById = {};
    records.forEach((record) => {
      const meta = metaFromRecord(record);
      if (meta?.id) nextMetaById[meta.id] = meta;
    });
    setIds(nextIds);
    setMetaById(nextMetaById);
  }, [config]);

  useEffect(() => {
    void refresh();
    return subscribeToOfflineItems(() => {
      void refresh();
    });
  }, [refresh]);

  const savedIds = useMemo(() => new Set(ids), [ids]);
  const busySet = useMemo(() => new Set(busyIds), [busyIds]);

  const setBusy = useCallback((id, busy) => {
    setBusyIds((current) => {
      if (busy) return current.includes(id) ? current : [...current, id];
      return current.filter((itemId) => itemId !== id);
    });
  }, []);

  const save = useCallback(async (item) => {
    if (!item?.id) throw new Error('Cannot save an item without an id.');
    setBusy(item.id, true);
    try {
      const savedItem = await config.save(item);
      await refresh();
      return savedItem;
    } finally {
      setBusy(item.id, false);
    }
  }, [config, refresh, setBusy]);

  const remove = useCallback(async (id) => {
    if (!id) return false;
    setBusy(id, true);
    try {
      const removed = await config.remove(id);
      await refresh();
      return removed;
    } finally {
      setBusy(id, false);
    }
  }, [config, refresh, setBusy]);

  const getMeta = useCallback((id) => metaById[id] || null, [metaById]);

  return {
    ids,
    savedIds,
    isSaved: (id) => savedIds.has(id),
    isBusy: (id) => busySet.has(id),
    getMeta,
    isOutdated: (item) => isOfflineCopyOutdated(item, getMeta(item?.id)),
    save,
    remove,
    refresh,
  };
}
