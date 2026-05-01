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
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">Upcoming Sunday Lineup</h2>
            <Link to="/lineups" className="text-sm font-semibold text-blue-700 hover:text-blue-900">View all</Link>
          </div>
          {upcoming ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-semibold uppercase text-blue-700">{upcoming.date} • {upcoming.serviceTime}</p>
                <h3 className="mt-1 text-xl font-bold text-slate-950">{upcoming.worshipLeader || 'Worship Leader TBD'}</h3>
              </div>
              <ol className="space-y-3">
                {upcoming.songs.map((song, index) => (
                  <li key={`${song.songId}-${index}`} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                    <span className="font-medium">{index + 1}. {song.title}</span>
                    <span className="rounded-md bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-900">{song.selectedKey}</span>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2">
                <Link className="btn-primary" to={`/lineups/${upcoming.id}`}>Open Lineup</Link>
                <Link className="btn-secondary" to={`/lineups/${upcoming.id}/monitor`}>
                  <Monitor size={18} aria-hidden="true" /> Monitor
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 p-6">
              <p className="text-slate-600">No upcoming lineup yet.</p>
              <Link className="btn-primary mt-4" to="/lineups/new">Create Sunday Lineup</Link>
            </div>
          )}
        </div>

        <div className="panel">
          <h2 className="section-title">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            <Link className="quick-action" to="/songs">
              <Library size={20} aria-hidden="true" /> View Song Library
            </Link>
            <Link className="quick-action" to="/songs/new">
              <Music2 size={20} aria-hidden="true" /> Add Chord Chart
            </Link>
            <Link className="quick-action" to="/lineups/new">
              <CalendarPlus size={20} aria-hidden="true" /> Build Sunday Lineup
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
