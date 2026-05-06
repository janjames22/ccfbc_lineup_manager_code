import { WifiOff } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

export default function OfflineStatusBadge() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm" title="Downloaded songs and lineups can be opened even without internet.">
      <WifiOff size={14} /> Offline Mode
    </div>
  );
}
