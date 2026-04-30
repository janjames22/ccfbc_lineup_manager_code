# Worship Chords & Sunday Lineup Manager

A local-first React app for worship song chord charts, Sunday lineups, team assignments, transposition, and vocalist lyrics monitoring.

## Run

```bash
npm install
npm run dev
```

## Notes

- Data is stored in `localStorage` under `worshipSongs` and `worshipLineups`.
- Lyrics monitor content is separate from chord charts.
- Store full lyrics only when the church/team has permission; otherwise use cues or placeholders.
