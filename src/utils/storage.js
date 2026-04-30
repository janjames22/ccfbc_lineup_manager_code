import { emptyMusicians } from './constants';

const SONGS_KEY = 'worshipSongs';
const LINEUPS_KEY = 'worshipLineups';

const sampleSong = {
  id: 'song_sample_001',
  title: 'Ikaw Lamang',
  artist: 'Rommel Guevara',
  originalKey: 'C',
  selectedKey: 'C',
  tempo: '72',
  category: 'Worship',
  language: 'Filipino',
  chordChart: 'Intro:\nC  G  Am  F\n\nVerse 1:\n[Team-approved chord chart here]\n\nChorus:\nC  G  Am  F',
  lyricsMonitor: [
    {
      section: 'Verse 1',
      text: '[Team-approved lyrics or cue text here]',
      vocalNotes: 'Vocals 1 lead. Vocals 2 and 3 enter softly.',
      repeatCount: '1',
    },
    {
      section: 'Chorus',
      text: '[Team-approved chorus cue here]',
      vocalNotes: 'All vocals sing together.',
      repeatCount: '2',
    },
  ],
  notes: 'Use soft intro, build up in chorus.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function safeParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function uid(prefix) {
  if (crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function read(key, fallback) {
  const value = safeParse(localStorage.getItem(key), fallback);
  if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(value));
  return value;
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('worship-storage-change'));
  return value;
}

function normalizeSong(song) {
  return {
    id: song.id || uid('song'),
    title: song.title?.trim() || 'Untitled Song',
    artist: song.artist || '',
    originalKey: song.originalKey || 'C',
    selectedKey: song.selectedKey || song.originalKey || 'C',
    tempo: song.tempo || '',
    category: song.category || 'Worship',
    language: song.language || '',
    chordChart: song.chordChart || '',
    lyricsMonitor: Array.isArray(song.lyricsMonitor) ? song.lyricsMonitor : [],
    notes: song.notes || '',
    createdAt: song.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function normalizeLineup(lineup) {
  return {
    id: lineup.id || uid('lineup'),
    date: lineup.date || '',
    serviceTime: lineup.serviceTime || '9:00 AM',
    worshipLeader: lineup.worshipLeader || '',
    songs: Array.isArray(lineup.songs) ? lineup.songs : [],
    musicians: { ...emptyMusicians(), ...(lineup.musicians || {}) },
    generalNotes: lineup.generalNotes || '',
    createdAt: lineup.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getSongs() {
  return read(SONGS_KEY, [sampleSong]).sort((a, b) => a.title.localeCompare(b.title));
}

export function getSongById(id) {
  return getSongs().find((song) => song.id === id) || null;
}

export function saveSong(song) {
  const songs = getSongs();
  const nextSong = normalizeSong(song);
  const nextSongs = songs.some((item) => item.id === nextSong.id)
    ? songs.map((item) => (item.id === nextSong.id ? { ...item, ...nextSong, createdAt: item.createdAt } : item))
    : [nextSong, ...songs];
  write(SONGS_KEY, nextSongs);
  return nextSong;
}

export function deleteSong(id) {
  write(SONGS_KEY, getSongs().filter((song) => song.id !== id));
  return true;
}

export function getLineups() {
  return read(LINEUPS_KEY, []).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export function getLineupById(id) {
  return getLineups().find((lineup) => lineup.id === id) || null;
}

export function saveLineup(lineup) {
  const lineups = getLineups();
  const nextLineup = normalizeLineup(lineup);
  const nextLineups = lineups.some((item) => item.id === nextLineup.id)
    ? lineups.map((item) => (item.id === nextLineup.id ? { ...item, ...nextLineup, createdAt: item.createdAt } : item))
    : [nextLineup, ...lineups];
  write(LINEUPS_KEY, nextLineups);
  return nextLineup;
}

export function deleteLineup(id) {
  write(LINEUPS_KEY, getLineups().filter((lineup) => lineup.id !== id));
  return true;
}

export function getUpcomingLineup() {
  const today = new Date().toISOString().slice(0, 10);
  return getLineups()
    .filter((lineup) => lineup.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}
