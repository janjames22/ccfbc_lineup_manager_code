import { Eye, Monitor, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatBpm } from '../utils/constants';

export default function SongCard({ song }) {
  return (
    <article className="panel flex flex-col justify-between p-5 sm:p-6 h-full">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{song.title}</h2>
            <p className="mt-0.5 text-sm font-medium text-slate-600">{song.artist || 'Unknown artist'}</p>
          </div>
          <span className="rounded-lg bg-blue-100/80 px-3 py-1.5 text-sm font-bold text-blue-800 shadow-sm border border-blue-200/50">{song.selectedKey || song.originalKey}</span>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">{song.category || '-'}</dd>
          </div>
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
            <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">BPM</dt>
            <dd className="mt-0.5 font-semibold text-slate-800">{formatBpm(song.tempo)}</dd>
          </div>
        </dl>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link to={`/songs/${song.id}`} className="btn-secondary flex-1 sm:flex-none">
          <Eye size={16} aria-hidden="true" /> View
        </Link>
        <Link to={`/lyrics-monitor/${song.id}`} className="btn-secondary flex-1 sm:flex-none">
          <Monitor size={16} aria-hidden="true" /> Monitor
        </Link>
        <Link to={`/songs/${song.id}/edit`} className="btn-secondary flex-1 sm:flex-none">
          <Pencil size={16} aria-hidden="true" /> Edit
        </Link>
      </div>
    </article>
  );
}
