import { ArrowLeft, Monitor, Pencil, Printer, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TeamAssignments from '../components/TeamAssignments';
import { deleteLineup, getLineupById, getSongs } from '../utils/storage';
import { getSemitoneDelta, transposeChords } from '../utils/transposeChords';

export default function LineupView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lineup, setLineup] = useState(null);
  const [songsMap, setSongsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [lineupData, allSongs] = await Promise.all([
        getLineupById(id),
        getSongs()
      ]);
      setLineup(lineupData);
      
      const map = {};
      allSongs.forEach(s => map[s.id] = s);
      setSongsMap(map);
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!lineup) {
    return (
      <main className="page-shell">
        <p className="text-slate-600">Lineup not found.</p>
        <Link className="btn-primary mt-4" to="/lineups"><ArrowLeft size={18} aria-hidden="true" /> Back to Lineups</Link>
      </main>
    );
  }

  const remove = async () => {
    if (confirm(`Delete lineup for ${lineup.date}?`)) {
      await deleteLineup(lineup.id);
      navigate('/lineups');
    }
  };

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Sunday Lineup"
        title={`${lineup.date} • ${lineup.serviceTime}`}
        description={lineup.worshipLeader ? `Worship Leader: ${lineup.worshipLeader}` : 'Worship Leader TBD'}
        actions={
          <>
            <Link className="btn-secondary" to="/lineups"><ArrowLeft size={18} aria-hidden="true" /> Lineups</Link>
            <Link className="btn-secondary" to={`/lineups/${lineup.id}/monitor`}><Monitor size={18} aria-hidden="true" /> Monitor</Link>
            <Link className="btn-secondary" to={`/lineups/${lineup.id}/print`}><Printer size={18} aria-hidden="true" /> Print</Link>
            <Link className="btn-secondary" to={`/lineups/${lineup.id}/edit`}><Pencil size={18} aria-hidden="true" /> Edit</Link>
            <button className="btn-danger" type="button" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete</button>
          </>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <div className="space-y-4">
          {lineup.songs.map((lineupSong, index) => {
            const song = songsMap[lineupSong.songId];
            const delta = song ? getSemitoneDelta(song.originalKey, lineupSong.selectedKey) : 0;
            return (
              <article key={`${lineupSong.songId}-${index}`} className="panel">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700">Song {index + 1}</p>
                    <h2 className="text-2xl font-bold text-slate-950">{lineupSong.title}</h2>
                    {lineupSong.notes && <p className="mt-1 text-sm text-slate-600">{lineupSong.notes}</p>}
                  </div>
                  <span className="w-fit rounded-md bg-amber-100 px-3 py-2 font-bold text-amber-900">Key: {lineupSong.selectedKey}</span>
                </div>
                <pre className="chord-sheet mt-4">{song ? transposeChords(song.chordChart, delta) || 'No chord chart added.' : 'Song not found in library.'}</pre>
              </article>
            );
          })}
        </div>

        <aside className="space-y-6">
          <section className="panel">
            <h2 className="section-title">Team Assignments</h2>
            <div className="mt-4">
              <TeamAssignments musicians={lineup.musicians} readOnly />
            </div>
          </section>
          {lineup.generalNotes && (
            <section className="panel">
              <h2 className="section-title">General Reminders</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">{lineup.generalNotes}</p>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
