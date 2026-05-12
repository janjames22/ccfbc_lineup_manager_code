import { BellOff, BellRing, Send } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  checkLineupPushSubscriptionHealth,
  getPushSupportStatus,
  sendTestPushNotification,
  subscribeToLineupPushNotifications,
  unsubscribeFromLineupPushNotifications,
} from '../utils/pushNotifications';

export default function PhoneNotificationsButton() {
  const [status, setStatus] = useState(() => getPushSupportStatus());
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const [message, setMessage] = useState('');

  const refreshHealth = useCallback(async (options = {}) => {
    const nextHealth = await checkLineupPushSubscriptionHealth(options);
    setStatus(nextHealth.support || getPushSupportStatus());
    setHealth(nextHealth);
    return nextHealth;
  }, []);

  useEffect(() => {
    let active = true;

    checkLineupPushSubscriptionHealth().then((nextHealth) => {
      if (!active) return;
      setStatus(nextHealth.support || getPushSupportStatus());
      setHealth(nextHealth);
    }).catch((error) => {
      console.error('[PushNotifications] health check failed:', error);
      if (!active) return;
      setHealth({ ok: false, code: 'health_check_failed', message: error?.message || 'Unable to check push subscription health.' });
      setStatus(getPushSupportStatus());
    });

    return () => {
      active = false;
    };
  }, []);

  const statusText = useMemo(() => {
    return health?.message || status.reason;
  }, [health, status.reason]);

  const enabled = Boolean(health?.ok);

  const handleEnable = async () => {
    setBusy(true);
    setMessage('');

    try {
      const result = await subscribeToLineupPushNotifications();
      await refreshHealth({ ensureRegistration: true, refreshServer: true });
      setMessage(result?.message || 'Phone notifications enabled for this device.');
    } catch (error) {
      console.error('[PushNotifications] failed to enable phone notifications:', error);
      await refreshHealth().catch(() => setStatus(getPushSupportStatus()));
      setMessage(error?.message || 'Unable to enable phone notifications.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setBusy(true);
    setMessage('');

    try {
      const result = await unsubscribeFromLineupPushNotifications();
      await refreshHealth();
      setMessage(result?.message || 'Phone notifications disabled for this device.');
    } catch (error) {
      console.error('[PushNotifications] failed to disable phone notifications:', error);
      setMessage(error?.message || 'Unable to disable phone notifications.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendTest = async () => {
    setTestBusy(true);
    setMessage('');

    try {
      const result = await sendTestPushNotification();
      await refreshHealth();
      setMessage(`Test push sent to ${result.sent || 0} device${result.sent === 1 ? '' : 's'}.`);
    } catch (error) {
      console.error('[PushNotifications] failed to send test notification:', error);
      await refreshHealth().catch(() => {});
      setMessage(error?.message || 'Unable to send test notification.');
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-400">Phone notifications</p>
          <p className={`text-xs font-semibold ${enabled ? 'text-emerald-300' : 'text-amber-300'}`}>
            {statusText}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-white transition-colors hover:border-blue-500/60 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={enabled ? handleDisable : handleEnable}
          disabled={(!enabled && !status.canEnable) || busy}
        >
          {enabled ? <BellOff size={14} aria-hidden="true" /> : <BellRing size={14} aria-hidden="true" />}
          {busy ? 'Working...' : enabled ? 'Disable phone notifications' : 'Enable phone notifications'}
        </button>
      </div>

      <div className="space-y-1 text-xs font-medium leading-relaxed text-slate-500">
        <p>Web push uses the OS default notification sound settings. Android browsers may vibrate when supported.</p>
        <p>Focus Mode, Do Not Disturb, Battery Saver, blocked site permissions, or OS notification settings can suppress alerts.</p>
      </div>

      {status.isIos && !status.isStandalone && (
        <p className="text-xs font-semibold text-amber-300">
          iPhone/iPad: add this PWA to the Home Screen, then open it from the Home Screen icon before enabling notifications.
        </p>
      )}
      {status.isVercelPreview && (
        <p className="text-xs font-semibold text-amber-300">
          Push subscriptions are tied to this exact URL. Delete old preview Home Screen apps and install from ccfbc-lineup-manager-code.vercel.app.
        </p>
      )}

      <button
        type="button"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-black text-slate-200 transition-colors hover:border-blue-500/60 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={handleSendTest}
        disabled={testBusy || !enabled}
      >
        <Send size={14} aria-hidden="true" />
        {testBusy ? 'Sending test...' : 'Send test notification'}
      </button>

      {message && <p className="text-xs font-semibold text-slate-300">{message}</p>}
    </div>
  );
}
