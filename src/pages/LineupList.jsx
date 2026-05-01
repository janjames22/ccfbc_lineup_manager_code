import { CalendarPlus, Eye, Pencil, Printer } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { getLineups } from '../utils/storage';

export default function LineupList() {
  const [lineups, setLineups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLineups() {
      try {
        const data = await getLineups();
        setLineups(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load lineups:', error);
        setError('Unable to load lineups. Please try again.');
        setLineups([]);
      } finally {
        setLoading(false);
      }
    }
    loadLineups();
  }, []);

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Sunday Lineups"
        title="Service Plans"
        description="Create, review, monitor, and print weekly worship lineups."
        actions={<Link className="btn-primary" to="/lineups/new"><CalendarPlus size={18} aria-hidden="true" /> Create Lineup</Link>}
      />

      {error && <p className="mb-4 text-sm font-semibold text-red-700">{error}</p>}

      {lineups.length ? (
        <div className="grid gap-4">
          {lineups.map((lineup) => (
            <article key={lineup.id} className="panel">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-blue-700">{lineup.date} • {lineup.serviceTime}</p>
                  <h2 className="text-xl font-bold text-slate-950">{lineup.worshipLeader || 'Worship Leader TBD'}</h2>
                  <p className="text-sm text-slate-600">{lineup.songs.length} songs</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="btn-secondary" to={`/lineups/${lineup.id}`}><Eye size={16} aria-hidden="true" /> View</Link>
                  <Link className="btn-secondary" to={`/lineups/${lineup.id}/edit`}><Pencil size={16} aria-hidden="true" /> Edit</Link>
                  <Link className="btn-secondary" to={`/lineups/${lineup.id}/print`}><Printer size={16} aria-hidden="true" /> Print</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No lineups yet" message="Create the first Sunday lineup and assign your team." action={<Link className="btn-primary" to="/lineups/new">Create Lineup</Link>} />
      )}
    </main>
  );
}
