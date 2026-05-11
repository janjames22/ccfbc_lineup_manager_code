# Worship Chords & Sunday Lineup Manager

A local-first React app for worship song chord charts, Sunday lineups, team assignments, transposition, and vocalist lyrics monitoring.

## Notifications

Lineup notifications use two layers:

- In-app sound plays only on the active device after the first user interaction.
- Idle/background phone and iPad notifications use PWA Web Push.

Required environment variables:

```bash
VITE_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:your-admin@example.com
SUPABASE_SERVICE_ROLE_KEY=
```

Keep `VAPID_PRIVATE_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose them to the frontend.

## Run

```bash
npm install
npm run dev
```

## Notes

- Data is stored in `localStorage` under `worshipSongs` and `worshipLineups`.
- Lyrics monitor content is separate from chord charts.
- Store full lyrics only when the church/team has permission; otherwise use cues or placeholders.
