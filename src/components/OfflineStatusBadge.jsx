import { WifiOff } from 'lucide-react';
import { useOffline } from '../hooks/useOffline';

export default function OfflineStatusBadge() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 shadow-sm">
      <WifiOff size={14} /> Offline Mode
    </div>
  );
}
