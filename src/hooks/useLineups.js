import { useRealtimeItems } from './useRealtimeItems';
import { getLineups, toCamelCaseLineup } from '../utils/storage';

function sortLineups(lineups) {
  return [...lineups].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function useLineups() {
  const result = useRealtimeItems({
    channelName: 'lineups-realtime',
    loadItems: getLineups,
    mapRow: toCamelCaseLineup,
    sortItems: sortLineups,
    table: 'lineups',
  });

  return {
    ...result,
    lineups: result.items,
  };
}
