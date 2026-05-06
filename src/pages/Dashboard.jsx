import { CalendarPlus, Library, Music2, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import SongCard from '../components/SongCard';
import { getSongs, getUpcomingLineup } from '../utils/storage';

export default function Dashboard() {
  const [songs, setSongs] = useState([]);
  const [upcoming, setUpcoming] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [songsData, upcomingData] = await Promise.all([
          getSongs(),
          getUpcomingLineup()
        ]);
        setSongs(Array.isArray(songsData) ? songsData : []);
        setUpcoming(upcomingData);
      } catch (error) {
        console.error("Failed to load songs:", error);
        setSongs([]);
        setUpcoming(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const recentSongs = songs.slice(0, 3);

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Dashboard"
        title="Prepare Sunday with one clear workspace"
        description="Manage worship songs, keys, arrangements, vocalist cues, and team assignments from a local-first app."
        actions={
          <>
            <Link className="btn-primary" to="/songs/new">
              <Music2 size={18} aria-hidden="true" /> Add Song
            </Link>
            <Link className="btn-secondary" to="/lineups/new">
              <CalendarPlus size={18} aria-hidden="true" /> Create Lineup
            </Link>
          </>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="panel">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="section-title">Upcoming Sunday Lineup</h2>
            <Link to="/lineups" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">View all</Link>
          </div>
          {upcoming ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 p-5 border border-blue-100/50">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{upcoming.date} • {upcoming.serviceTime}</p>
                <h3 className="mt-1.5 text-2xl font-extrabold text-slate-900">{upcoming.worshipLeader || 'Worship Leader TBD'}</h3>
              </div>
              <ol className="space-y-3">
                {upcoming.songs.map((song, index) => (
                  <li key={`${song.id || song.songId}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-3.5 transition hover:bg-slate-50 hover:border-slate-300">
                    <span className="font-semibold text-slate-800">{index + 1}. {song.title}</span>
                    <span className="rounded-lg bg-amber-100/80 px-2.5 py-1 text-xs font-bold text-amber-900 shadow-sm border border-amber-200/50">{song.selectedKey}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-2 flex flex-wrap gap-3">
                <Link className="btn-primary flex-1 sm:flex-none" to={`/lineups/${upcoming.id}`}>Open Lineup</Link>
                <Link className="btn-secondary flex-1 sm:flex-none" to={`/lineups/${upcoming.id}/monitor`}>
                  <Monitor size={18} aria-hidden="true" /> Monitor
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center transition hover:border-slate-300">
              <p className="text-slate-500 font-medium">No upcoming lineup yet.</p>
              <Link className="btn-primary mt-5 mx-auto" to="/lineups/new">Create Sunday Lineup</Link>
            </div>
          )}
        </div>

        <div className="panel h-fit">
          <h2 className="section-title mb-6">Quick Actions</h2>
          <div className="grid gap-3">
            <Link className="quick-action" to="/songs">
              <span className="grid size-10 place-items-center rounded-lg bg-blue-100 text-blue-700 shadow-sm"><Library size={20} aria-hidden="true" /></span>
              <span className="flex flex-col">
                <span className="font-bold text-slate-900">View Song Library</span>
                <span className="text-xs font-medium text-slate-500">Browse and search chords</span>
              </span>
            </Link>
            <Link className="quick-action" to="/songs/new">
              <span className="grid size-10 place-items-center rounded-lg bg-amber-100 text-amber-700 shadow-sm"><Music2 size={20} aria-hidden="true" /></span>
              <span className="flex flex-col">
                <span className="font-bold text-slate-900">Add Chord Chart</span>
                <span className="text-xs font-medium text-slate-500">Add a new song to your library</span>
              </span>
            </Link>
            <Link className="quick-action" to="/lineups/new">
              <span className="grid size-10 place-items-center rounded-lg bg-emerald-100 text-emerald-700 shadow-sm"><CalendarPlus size={20} aria-hidden="true" /></span>
              <span className="flex flex-col">
                <span className="font-bold text-slate-900">Build Sunday Lineup</span>
                <span className="text-xs font-medium text-slate-500">Plan a new service</span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Recently Added Songs</h2>
          <Link to="/songs" className="text-sm font-semibold text-blue-700 hover:text-blue-900">Open library</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentSongs.map((song) => <SongCard key={song.id} song={song} />)}
        </div>
      </section>
    </main>
  );
}
