# Worship Chords & Sunday Lineup Manager

A local-first React app for worship song chord charts, Sunday lineups, team assignments, transposition, and vocalist lyrics monitoring.

## Notifications

Lineup notifications use three layers:

- In-app sound plays only on the active device after the first user interaction.
- Idle/background phone and iPad notifications use PWA Web Push.
- Installed app icon badges use the App Badging API where the browser and OS support it.

Required environment variables:

```bash
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:your-admin@example.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`VITE_VAPID_PUBLIC_KEY` is still supported for local builds, but the preferred production setup is `VAPID_PUBLIC_KEY` served by `/api/push/public-key`. Keep `VAPID_PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose them to the frontend.

Web Push routes:

- `POST /api/push/subscribe`
- `POST /api/push/unsubscribe`
- `POST /api/push/send-test`
- `POST /api/push/send-lineup`
- `POST /api/lineup-notifications/mark-read`

The optional server-side `lineup_notifications` table stores notification history/read-state metadata through trusted API routes only. The public frontend still keeps the member-facing notification panel device-local and does not need login.

iPhone/iPad Web Push requires a supported iOS/iPadOS version and the PWA installed to the Home Screen. Web push cannot force a custom sound while the app is idle or the screen is locked; the OS notification sound settings control that behavior.
Android/iOS notification settings, Focus Mode, Do Not Disturb, battery saver, and browser/PWA rules still decide whether a push appears as a banner, status notification, lock-screen notification, or only in the notification tray.

## Run

```bash
npm install
npm run dev
```

## Notes

- Data is stored in `localStorage` under `worshipSongs` and `worshipLineups`.
- Lyrics monitor content is separate from chord charts.
- Store full lyrics only when the church/team has permission; otherwise use cues or placeholders.
