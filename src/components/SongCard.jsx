import { Eye, Monitor, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBpm } from '../utils/constants';

export default function SongCard({ song }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{song.title}</h2>
          <p className="text-sm text-slate-600">{song.artist || 'Unknown artist'}</p>
        </div>
        <span className="rounded-md bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">{song.selectedKey || song.originalKey}</span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Category</dt>
          <dd className="font-medium text-slate-800">{song.category || '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">BPM</dt>
          <dd className="font-medium text-slate-800">{formatBpm(song.tempo)}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link to={`/songs/${song.id}`} className="btn-secondary">
          <Eye size={16} aria-hidden="true" /> View
        </Link>
        <Link to={`/lyrics-monitor/${song.id}`} className="btn-secondary">
          <Monitor size={16} aria-hidden="true" /> Monitor
        </Link>
        <Link to={`/songs/${song.id}/edit`} className="btn-secondary">
          <Pencil size={16} aria-hidden="true" /> Edit
        </Link>
      </div>
    </article>
  );
}
