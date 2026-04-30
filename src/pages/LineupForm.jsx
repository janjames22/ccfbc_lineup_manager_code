import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TeamAssignments from '../components/TeamAssignments';
import { KEYS, emptyMusicians } from '../utils/constants';
import { getLineupById, getSongs, saveLineup } from '../utils/storage';

function nextSunday() {
  const date = new Date();
  const days = (7 - date.getDay()) || 7;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

const blankLineup = {
  date: nextSunday(),
  serviceTime: '9:00 AM',
  worshipLeader: '',
  songs: [],
  musicians: emptyMusicians(),
  generalNotes: '',
};

export default function LineupForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [songs, setSongs] = useState([]);
  const [lineup, setLineup] = useState(blankLineup);
  const [selectedSongId, setSelectedSongId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [songsData, lineupData] = await Promise.all([
        getSongs(),
        id ? getLineupById(id) : null
      ]);
      setSongs(songsData);
      setLineup(lineupData || blankLineup);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const update = (field, value) => setLineup((current) => ({ ...current, [field]: value }));
  const updateLineupSong = (index, field, value) => update('songs', lineup.songs.map((song, itemIndex) => (itemIndex === index ? { ...song, [field]: value } : song)));

  const addSong = () => {
    const song = songs.find((item) => item.id === selectedSongId);
    if (!song || lineup.songs.some((item) => item.songId === song.id)) return;
    update('songs', [
      ...lineup.songs,
      {
        songId: song.id,
        title: song.title,
        selectedKey: song.selectedKey || song.originalKey,
        order: lineup.songs.length + 1,
        notes: '',
      },
    ]);
    setSelectedSongId('');
  };

  const removeSong = (index) => {
    update('songs', lineup.songs.filter((_, itemIndex) => itemIndex !== index).map((song, itemIndex) => ({ ...song, order: itemIndex + 1 })));
  };

  const moveSong = (index, delta) => {
    const nextSongs = [...lineup.songs];
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= nextSongs.length) return;
    [nextSongs[index], nextSongs[nextIndex]] = [nextSongs[nextIndex], nextSongs[index]];
    update('songs', nextSongs.map((song, itemIndex) => ({ ...song, order: itemIndex + 1 })));
  };

  const save = async (event) => {
    event.preventDefault();
    const saved = await saveLineup(lineup);
    navigate(`/lineups/${saved.id}`);
  };

  const availableSongs = songs.filter((song) => !lineup.songs.some((item) => item.songId === song.id));

  if (loading) {
    return (
      <main className="page-shell">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <PageHeader eyebrow={id ? 'Edit Lineup' : 'Create Lineup'} title={id ? 'Update Sunday Lineup' : 'Create Sunday Lineup'} />
      <form className="space-y-6" onSubmit={save}>
        <section className="panel">
          <h2 className="section-title">Service Details</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label><span className="label">Date *</span><input className="input" type="date" required value={lineup.date} onChange={(event) => update('date', event.target.value)} /></label>
            <label><span className="label">Service Time</span><input className="input" value={lineup.serviceTime} onChange={(event) => update('serviceTime', event.target.value)} /></label>
            <label><span className="label">Worship Leader</span><input className="input" value={lineup.worshipLeader} onChange={(event) => update('worshipLeader', event.target.value)} /></label>
          </div>
        </section>

        <section className="panel">
          <h2 className="section-title">Song Order</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select className="input" value={selectedSongId} onChange={(event) => setSelectedSongId(event.target.value)}>
              <option value="">Select a song</option>
              {availableSongs.map((song) => <option key={song.id} value={song.id}>{song.title} - {song.originalKey}</option>)}
            </select>
            <button className="btn-secondary" type="button" onClick={addSong}><Plus size={18} aria-hidden="true" /> Add</button>
          </div>

          <div className="mt-5 space-y-3">
            {lineup.songs.map((song, index) => (
              <div key={`${song.songId}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <h3 className="font-bold text-slate-950">{index + 1}. {song.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    <button className="icon-button" type="button" onClick={() => moveSong(index, -1)} title="Move up"><ArrowUp size={18} aria-hidden="true" /></button>
                    <button className="icon-button" type="button" onClick={() => moveSong(index, 1)} title="Move down"><ArrowDown size={18} aria-hidden="true" /></button>
                    <button className="icon-button danger" type="button" onClick={() => removeSong(index)} title="Remove song"><Trash2 size={18} aria-hidden="true" /></button>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-[0.4fr_1fr]">
                  <select className="input" value={song.selectedKey} onChange={(event) => updateLineupSong(index, 'selectedKey', event.target.value)}>
                    {KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
                  </select>
                  <input className="input" value={song.notes} onChange={(event) => updateLineupSong(index, 'notes', event.target.value)} placeholder="Song notes" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2 className="section-title">Team Assignments</h2>
          <div className="mt-4">
            <TeamAssignments musicians={lineup.musicians} onChange={(key, value) => update('musicians', { ...lineup.musicians, [key]: value })} />
          </div>
        </section>

        <section className="panel">
          <label><span className="label">General Reminders</span><textarea className="textarea" value={lineup.generalNotes} onChange={(event) => update('generalNotes', event.target.value)} /></label>
        </section>

        <button className="btn-primary" type="submit">{id ? 'Update Lineup' : 'Save Lineup'}</button>
      </form>
    </main>
  );
}
