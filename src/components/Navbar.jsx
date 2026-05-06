import { BookOpen, CalendarDays, Home, Music2, Plus } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import OfflineStatusBadge from './OfflineStatusBadge';

const navLink = ({ isActive }) =>
  `inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-blue-700 text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
  }`;

export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-md bg-blue-700 text-white">
            <Music2 size={22} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-bold text-slate-950">Worship Chords</span>
            <span className="block text-xs text-slate-500">Sunday Lineup Manager</span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          <OfflineStatusBadge />
          <NavLink to="/" className={navLink}>
            <Home size={16} aria-hidden="true" /> Dashboard
          </NavLink>
          <NavLink to="/songs" className={navLink}>
            <BookOpen size={16} aria-hidden="true" /> Songs
          </NavLink>
          <NavLink to="/lineups" className={navLink}>
            <CalendarDays size={16} aria-hidden="true" /> Lineups
          </NavLink>
          <Link to="/songs/new" className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400">
            <Plus size={16} aria-hidden="true" /> Add Song
          </Link>
        </nav>
      </div>
    </header>
  );
}
