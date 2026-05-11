import { BellRing } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  getPushSupportStatus,
  subscribeToLineupPushNotifications,
} from '../utils/pushNotifications';

export default function PhoneNotificationsButton() {
  const [status, setStatus] = useState(() => getPushSupportStatus());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const isDenied = status.permission === 'denied';
  const canEnable = status.supported && !isDenied;

  useEffect(() => {
    setStatus(getPushSupportStatus());
  }, []);

  const statusText = useMemo(() => {
    if (!status.supported) return 'Not supported';
    if (status.permission === 'granted') return 'Permission granted';
    if (status.permission === 'denied') return 'Permission denied';
    return 'Supported';
  }, [status]);

  const handleEnable = async () => {
    setBusy(true);
    setMessage('');

    try {
      const result = await subscribeToLineupPushNotifications();
      setStatus(getPushSupportStatus());
      setMessage(result?.message || 'Phone notifications enabled.');
    } catch (error) {
      console.error('[LineupNotifications] failed to enable phone notifications:', error);
      setStatus(getPushSupportStatus());
      setMessage(error?.message || 'Unable to enable phone notifications.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400">Phone notifications</p>
          <p className={`text-xs font-semibold ${status.permission === 'denied' || !status.supported ? 'text-amber-300' : 'text-slate-500'}`}>
            {statusText}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-white transition-colors hover:border-blue-500/60 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleEnable}
          disabled={!canEnable || busy}
        >
          <BellRing size={14} aria-hidden="true" />
          {busy ? 'Enabling...' : 'Enable phone notifications'}
        </button>
      </div>
      <p className="text-xs font-medium leading-relaxed text-slate-500">
        For iPhone/iPad idle notifications, install this app to Home Screen first, then enable notifications.
      </p>
      {status.isIos && !status.isStandalone && (
        <p className="text-xs font-semibold text-amber-300">
          iPhone/iPad detected: install to Home Screen first.
        </p>
      )}
      {message && <p className="text-xs font-semibold text-slate-300">{message}</p>}
    </div>
  );
}
