import { supabase, isSupabaseConfigured } from './supabase';
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

// ============================================
// Field Mapping Functions
// ============================================

// Convert camelCase app fields to snake_case Supabase columns
function toSnakeCaseSong(song) {
  return {
    id: song.id,
    title: song.title,
    artist: song.artist || '',
    original_key: song.originalKey || 'C',
    selected_key: song.selectedKey || song.originalKey || 'C',
    tempo: song.tempo || '',
    category: song.category || 'Worship',
    language: song.language || '',
    chord_chart: song.chordChart || '',
    lyrics_monitor: song.lyricsMonitor ? JSON.stringify(song.lyricsMonitor) : '[]',
    notes: song.notes || '',
    created_at: song.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function toSnakeCaseLineup(lineup) {
  return {
    id: lineup.id,
    date: lineup.date || '',
    service_time: lineup.serviceTime || '9:00 AM',
    worship_leader: lineup.worshipLeader || '',
    songs: JSON.stringify(lineup.songs || []),
    musicians: JSON.stringify({ ...emptyMusicians(), ...(lineup.musicians || {}) }),
    general_notes: lineup.generalNotes || '',
    created_at: lineup.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Convert snake_case Supabase columns to camelCase app fields
function toCamelCaseSong(dbSong) {
  if (!dbSong) return null;
  return {
    id: dbSong.id,
    title: dbSong.title,
    artist: dbSong.artist || '',
    originalKey: dbSong.original_key || 'C',
    selectedKey: dbSong.selected_key || dbSong.original_key || 'C',
    tempo: dbSong.tempo || '',
    category: dbSong.category || 'Worship',
    language: dbSong.language || '',
    chordChart: dbSong.chord_chart || '',
    lyricsMonitor: typeof dbSong.lyrics_monitor === 'string' 
      ? JSON.parse(dbSong.lyrics_monitor) 
      : (dbSong.lyrics_monitor || []),
    notes: dbSong.notes || '',
    createdAt: dbSong.created_at,
    updatedAt: dbSong.updated_at,
  };
}

function toCamelCaseLineup(dbLineup) {
  if (!dbLineup) return null;
  return {
    id: dbLineup.id,
    date: dbLineup.date || '',
    serviceTime: dbLineup.service_time || '9:00 AM',
    worshipLeader: dbLineup.worship_leader || '',
    songs: typeof dbLineup.songs === 'string' ? JSON.parse(dbLineup.songs) : (dbLineup.songs || []),
    musicians: typeof dbLineup.musicians === 'string' 
      ? JSON.parse(dbLineup.musicians) 
      : (dbLineup.musicians || {}),
    generalNotes: dbLineup.general_notes || '',
    createdAt: dbLineup.created_at,
    updatedAt: dbLineup.updated_at,
  };
}

// ============================================
// LocalStorage Helper Functions
// ============================================

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

// ============================================
// Songs API (Async with Supabase + LocalStorage Fallback)
// ============================================

export async function getSongs() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .order('title', { ascending: true });
      
      if (error) {
        console.error('Supabase getSongs error:', error.message);
      } else if (data) {
        return data.map(toCamelCaseSong);
      }
    } catch (err) {
      console.error('Supabase getSongs failed:', err.message);
    }
  }
  
  // Fallback to localStorage
  return read(SONGS_KEY, [sampleSong]).sort((a, b) => a.title.localeCompare(b.title));
}

export async function getSongById(id) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('songs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Supabase getSongById error:', error.message);
      } else if (data) {
        return toCamelCaseSong(data);
      }
    } catch (err) {
      console.error('Supabase getSongById failed:', err.message);
    }
  }
  
  // Fallback to localStorage
  return getSongs().find((song) => song.id === id) || null;
}

export async function saveSong(song) {
  const nextSong = normalizeSong(song);
  
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const snakeSong = toSnakeCaseSong(nextSong);
      
      // Check if song exists
      const { data: existing } = await supabase
        .from('songs')
        .select('id')
        .eq('id', nextSong.id)
        .single();
      
      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from('songs')
          .update(snakeSong)
          .eq('id', nextSong.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('songs')
          .insert(snakeSong)
          .select()
          .single();
      }
      
      if (result.error) {
        console.error('Supabase saveSong error:', result.error.message);
      } else if (result.data) {
        return toCamelCaseSong(result.data);
      }
    } catch (err) {
      console.error('Supabase saveSong failed:', err.message);
    }
  }
  
  // Fallback to localStorage
  const songs = await getSongs();
  const nextSongs = songs.some((item) => item.id === nextSong.id)
    ? songs.map((item) => (item.id === nextSong.id ? { ...item, ...nextSong, createdAt: item.createdAt } : item))
    : [nextSong, ...songs];
  write(SONGS_KEY, nextSongs);
  return nextSong;
}

export async function deleteSong(id) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('songs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase deleteSong error:', error.message);
      }
    } catch (err) {
      console.error('Supabase deleteSong failed:', err.message);
    }
  }
  
  // Always fallback to localStorage as well
  const songs = await getSongs();
  write(SONGS_KEY, songs.filter((song) => song.id !== id));
  return true;
}

// ============================================
// Lineups API (Async with Supabase + LocalStorage Fallback)
// ============================================

export async function getLineups() {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) {
        console.error('Supabase getLineups error:', error.message);
      } else if (data) {
        return data.map(toCamelCaseLineup);
      }
    } catch (err) {
      console.error('Supabase getLineups failed:', err.message);
    }
  }
  
  // Fallback to localStorage
  return read(LINEUPS_KEY, []).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
}

export async function getLineupById(id) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('lineups')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Supabase getLineupById error:', error.message);
      } else if (data) {
        return toCamelCaseLineup(data);
      }
    } catch (err) {
      console.error('Supabase getLineupById failed:', err.message);
    }
  }
  
  // Fallback to localStorage
  const lineups = await getLineups();
  return lineups.find((lineup) => lineup.id === id) || null;
}

export async function saveLineup(lineup) {
  const nextLineup = normalizeLineup(lineup);
  
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const snakeLineup = toSnakeCaseLineup(nextLineup);
      
      // Check if lineup exists
      const { data: existing } = await supabase
        .from('lineups')
        .select('id')
        .eq('id', nextLineup.id)
        .single();
      
      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from('lineups')
          .update(snakeLineup)
          .eq('id', nextLineup.id)
          .select()
          .single();
      } else {
        // Insert new
        result = await supabase
          .from('lineups')
          .insert(snakeLineup)
          .select()
          .single();
      }
      
      if (result.error) {
        console.error('Supabase saveLineup error:', result.error.message);
      } else if (result.data) {
        return toCamelCaseLineup(result.data);
      }
    } catch (err) {
      console.error('Supabase saveLineup failed:', err.message);
    }
  }
  
  // Fallback to localStorage
  const lineups = await getLineups();
  const nextLineups = lineups.some((item) => item.id === nextLineup.id)
    ? lineups.map((item) => (item.id === nextLineup.id ? { ...item, ...nextLineup, createdAt: item.createdAt } : item))
    : [nextLineup, ...lineups];
  write(LINEUPS_KEY, nextLineups);
  return nextLineup;
}

export async function deleteLineup(id) {
  // Try Supabase first
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('lineups')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase deleteLineup error:', error.message);
      }
    } catch (err) {
      console.error('Supabase deleteLineup failed:', err.message);
    }
  }
  
  // Always fallback to localStorage as well
  const lineups = await getLineups();
  write(LINEUPS_KEY, lineups.filter((lineup) => lineup.id !== id));
  return true;
}

export async function getUpcomingLineup() {
  const today = new Date().toISOString().slice(0, 10);
  const lineups = await getLineups();
  return lineups
    .filter((lineup) => lineup.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}
