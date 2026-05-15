import { useRealtimeItems } from './useRealtimeItems';
import { getSongs, toCamelCaseSong } from '../utils/storage';

function sortSongs(songs) {
  return [...songs].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
}

export function useSongs() {
  const result = useRealtimeItems({
    channelName: 'songs-realtime',
    loadItems: getSongs,
    mapRow: toCamelCaseSong,
    sortItems: sortSongs,
    table: 'songs',
  });

  return {
    ...result,
    songs: result.items,
  };
}
