import { Bell, CheckCheck, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneNotificationsButton from './PhoneNotificationsButton';

const IS_DEV = import.meta.env.DEV;

function debugNotificationBell(message, details) {
  if (!IS_DEV) return;
  if (typeof details === 'undefined') {
    console.log(`[LineupNotifications] ${message}`);
    return;
  }
  console.log(`[LineupNotifications] ${message}`, details);
}

export default function NotificationBell({
  notifications,
  unreadCount,
  onMarkAllRead,
  onMarkNotificationRead,
  onClearNotification,
  soundEnabled = true,
  onSoundEnabledChange,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const sortedNotifications = useMemo(() => {
    return [...notifications].sort((first, second) => {
      if (first.read !== second.read) return first.read ? 1 : -1;
      return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
    });
  }, [notifications]);

  useEffect(() => {
    debugNotificationBell('NotificationBell mounted in Navbar/App layout');
    return () => {
      debugNotificationBell('NotificationBell unmounted from Navbar/App layout');
    };
  }, []);

  useEffect(() => {
    debugNotificationBell('NotificationBell render state', {
      notificationCount: notifications.length,
      unreadCount,
      open,
      soundEnabled,
    });
  }, [notifications, unreadCount, open, soundEnabled]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const handleNotificationClick = (notification) => {
    debugNotificationBell('notification row clicked');
    debugNotificationBell('clicked notification', notification);

    if (!notification?.lineupId) {
      console.warn('[LineupNotifications] notification click skipped because lineupId is missing.', notification);
      return;
    }

    const targetUrl = `/lineups/${notification.lineupId}`;
    debugNotificationBell('lineupId', notification.lineupId);
    debugNotificationBell('navigating to', targetUrl);

    onMarkNotificationRead?.(notification.id);
    setOpen(false);
    navigate(targetUrl);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="relative inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm font-bold text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell size={16} aria-hidden="true" />
        <span className="hidden sm:inline">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-blue-500 px-1.5 text-[10px] font-black leading-5 text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] top-[calc(env(safe-area-inset-top)+4.75rem)] z-[120] pointer-events-auto overflow-y-auto overscroll-contain rounded-xl border border-slate-700 bg-slate-900 shadow-2xl ring-1 ring-white/10 lg:absolute lg:inset-x-auto lg:bottom-auto lg:right-0 lg:top-full lg:mt-2 lg:max-h-[min(42rem,calc(100vh-8rem))] lg:w-[min(calc(100vw-2rem),22rem)]">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 p-4 backdrop-blur">
            <div>
              <p className="text-sm font-black text-white">Notifications</p>
              <p className="text-xs font-semibold text-slate-500">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p>
            </div>
            <button
              className="text-xs font-black uppercase tracking-wider text-blue-300 transition-colors hover:text-blue-200 disabled:cursor-not-allowed disabled:text-slate-600"
              type="button"
              onClick={onMarkAllRead}
              disabled={!unreadCount}
              aria-label="Mark all notifications read"
            >
              <CheckCheck size={16} className="mr-1 inline" aria-hidden="true" />
              Read
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
            <span className="text-xs font-bold text-slate-400">Notification sound</span>
            <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
                checked={soundEnabled}
                onChange={(event) => onSoundEnabledChange?.(event.target.checked)}
              />
              <span>{soundEnabled ? 'On' : 'Off'}</span>
            </label>
          </div>

          <div className="border-b border-slate-800/80 px-4 py-3">
            <PhoneNotificationsButton />
          </div>

          <div>
            {sortedNotifications.length ? sortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex min-w-0 items-stretch gap-2 border-b p-2 last:border-b-0 ${
                  notification.read
                    ? 'border-slate-800/70 bg-slate-900'
                    : 'border-blue-500/20 bg-blue-500/[0.07]'
                }`}
              >
                <button
                  type="button"
                  className={`flex min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-xl px-2 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/70 ${
                    notification.read ? 'hover:bg-slate-800/80' : 'hover:bg-blue-500/10'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  aria-label={`Open lineup for ${notification.message || notification.title || 'this notification'}`}
                >
                  <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${notification.read ? 'bg-slate-700' : 'bg-blue-400 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className={`block min-w-0 flex-1 break-words text-sm font-black ${notification.read ? 'text-slate-300' : 'text-white'}`}>
                        {notification.title || 'New lineup added'}
                      </span>
                      {!notification.read && (
                        <span className="shrink-0 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-blue-200">
                          New
                        </span>
                      )}
                    </span>
                    <span className={`mt-1 block break-words text-xs font-semibold ${notification.read ? 'text-slate-500' : 'text-slate-300'}`}>
                      {notification.message}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-slate-600">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </span>
                </button>
                <button
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-white"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onClearNotification(notification.id);
                  }}
                  aria-label="Remove notification"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            )) : (
              <p className="p-5 text-sm font-semibold text-slate-500">No new notifications.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
