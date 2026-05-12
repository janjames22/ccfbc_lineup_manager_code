# Worship Chords & Sunday Lineup Manager

A local-first React app for worship song chord charts, Sunday lineups, team assignments, transposition, and vocalist lyrics monitoring.

## Notifications

Lineup notifications use two layers:

- In-app sound plays only on the active device after the first user interaction.
- Idle/background phone and iPad notifications use PWA Web Push.

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

iPhone/iPad Web Push requires a supported iOS/iPadOS version and the PWA installed to the Home Screen. Web push cannot force a custom sound while the app is idle or the screen is locked; the OS notification sound settings control that behavior.

## Run

```bash
npm install
npm run dev
```

## Notes

- Data is stored in `localStorage` under `worshipSongs` and `worshipLineups`.
- Lyrics monitor content is separate from chord charts.
- Store full lyrics only when the church/team has permission; otherwise use cues or placeholders.
