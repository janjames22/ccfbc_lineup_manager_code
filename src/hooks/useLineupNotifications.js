import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from './useToast';
import { supabase, isSupabaseConfigured } from '../utils/supabase';
import {
  consumeLocalLineupCreation,
  createLineupNotification,
  createLineupNotificationFromPush,
  readNotificationSoundEnabled,
  readStoredLineupNotifications,
  storeNotificationSoundEnabled,
  storeLineupNotifications,
} from '../utils/lineupNotifications';
import { playNotificationSound } from '../utils/notificationAudio';
import {
  readPendingLineupPushNotifications,
  removePendingLineupPushNotifications,
  setLineupAppBadge,
} from '../utils/appBadge';

const LINEUP_NOTIFICATION_CHANNEL = 'lineup-notifications';
const IS_DEV = import.meta.env.DEV;

function debugLineupNotifications(message, details) {
  if (!IS_DEV) return;
  if (typeof details === 'undefined') {
    console.log(`[LineupNotifications] ${message}`);
    return;
  }
  console.log(`[LineupNotifications] ${message}`, details);
}

export default function useLineupNotifications() {
  const [notifications, setNotifications] = useState(readStoredLineupNotifications);
  const [soundEnabled, setSoundEnabledState] = useState(readNotificationSoundEnabled);
  const channelRef = useRef(null);
  const showToastErrorRef = useRef(false);
  const showToastRef = useRef(() => {});
  const notifiedLineupIdsRef = useRef(new Set(readStoredLineupNotifications().map((notification) => notification?.lineupId).filter(Boolean)));
  const soundEnabledRef = useRef(soundEnabled);
  const { showToast } = useToast();

  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    storeNotificationSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const updateNotifications = useCallback((updater) => {
    setNotifications((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      debugLineupNotifications('notification list after update', next);
      storeLineupNotifications(next);
      notifiedLineupIdsRef.current = new Set(next.map((notification) => notification?.lineupId).filter(Boolean));
      return next;
    });
  }, []);

  useEffect(() => {
    const unreadCount = notifications.filter((notification) => !notification.read).length;
    setLineupAppBadge(unreadCount).catch((error) => {
      debugLineupNotifications('app badge sync failed', error);
    });
  }, [notifications]);

  useEffect(() => {
    let cancelled = false;

    readPendingLineupPushNotifications().then(async (pendingNotifications) => {
      if (cancelled || !pendingNotifications.length) return;

      const importedIds = [];
      const importedNotifications = pendingNotifications
        .map((pendingNotification) => {
          const notification = createLineupNotificationFromPush(pendingNotification);
          if (notification) importedIds.push(pendingNotification.id);
          return notification;
        })
        .filter(Boolean);

      if (!importedNotifications.length) {
        await removePendingLineupPushNotifications(pendingNotifications.map((notification) => notification.id));
        return;
      }

      updateNotifications((current) => {
        const existingIds = new Set(current.map((notification) => notification.id).filter(Boolean));
        const existingLineupIds = new Set(current.map((notification) => notification.lineupId).filter(Boolean));
        const nextImports = importedNotifications.filter((notification) => (
          !existingIds.has(notification.id) && !existingLineupIds.has(notification.lineupId)
        ));

        if (!nextImports.length) return current;
        return [...nextImports, ...current];
      });

      await removePendingLineupPushNotifications(importedIds);
    }).catch((error) => {
      debugLineupNotifications('pending push notification import failed', error);
    });

    return () => {
      cancelled = true;
    };
  }, [updateNotifications]);

  const markAllRead = useCallback(() => {
    updateNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  }, [updateNotifications]);

  const markNotificationRead = useCallback((notificationId) => {
    updateNotifications((current) => current.map((notification) => (
      notification.id === notificationId ? { ...notification, read: true } : notification
    )));
  }, [updateNotifications]);

  const clearNotification = useCallback((notificationId) => {
    updateNotifications((current) => current.filter((notification) => notification.id !== notificationId));
  }, [updateNotifications]);

  const setSoundEnabled = useCallback((enabled) => {
    setSoundEnabledState(Boolean(enabled));
  }, []);

  const handleNewLineup = useCallback((lineupRow, eventType = 'UNKNOWN') => {
    debugLineupNotifications('handleNewLineup called', { eventType, lineupRow });

    if (!lineupRow || typeof lineupRow !== 'object') {
      console.warn('[LineupNotifications] Skipping notification because lineup row is missing or invalid.');
      return;
    }

    if (consumeLocalLineupCreation(lineupRow)) {
      debugLineupNotifications('skipping notification because this browser tab created the lineup', lineupRow);
      return;
    }

    const notification = createLineupNotification(lineupRow);
    if (!notification?.lineupId) {
      console.warn('[LineupNotifications] Skipping notification because lineupId is missing.', lineupRow);
      return;
    }

    if (notifiedLineupIdsRef.current.has(notification.lineupId)) {
      debugLineupNotifications('notification list update skipped because lineupId already exists', notification.lineupId);
      return;
    }

    debugLineupNotifications('created notification', notification);
    notifiedLineupIdsRef.current.add(notification.lineupId);

    updateNotifications((current) => {
      return [notification, ...current];
    });

    debugLineupNotifications('triggering toast for notification', notification.message);
    showToastRef.current(notification.message, 'info', 6000);

    if (soundEnabledRef.current) {
      playNotificationSound().catch((error) => {
        console.warn('[LineupNotifications] failed to play notification sound:', error);
      });
    }
  }, [updateNotifications]);

  useEffect(() => {
    debugLineupNotifications('mounting subscription');

    if (!isSupabaseConfigured()) {
      console.warn('[LineupNotifications] Existing Supabase client is not configured. Subscription was not created.');
      return undefined;
    }

    if (channelRef.current) {
      console.warn('[LineupNotifications] Subscription already mounted. Reusing existing channel.');
      return undefined;
    }

    const channel = supabase
      .channel(LINEUP_NOTIFICATION_CHANNEL)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lineups',
        },
        (payload) => {
          debugLineupNotifications('realtime event received', payload);
          debugLineupNotifications('eventType', payload.eventType);
          debugLineupNotifications('new row', payload.new);
          debugLineupNotifications('old row', payload.old);

          if (payload.eventType === 'INSERT') {
            handleNewLineup(payload.new, payload.eventType);
            return;
          }

          debugLineupNotifications('realtime event ignored because it is not INSERT');
        }
      )
      .subscribe((status) => {
        debugLineupNotifications('subscription status', status);

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[LineupNotifications] Realtime channel is not healthy. Check Supabase client env and Realtime delivery.', { status });
          if (!showToastErrorRef.current) {
            showToastErrorRef.current = true;
            showToastRef.current('Lineup notifications are not connected. Check Realtime delivery.', 'error', 7000);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      debugLineupNotifications('cleaning up subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [handleNewLineup]);

  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read).length,
    markAllRead,
    markNotificationRead,
    clearNotification,
    soundEnabled,
    setSoundEnabled,
  };
}
