import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import InstallBanner from './components/InstallBanner';
import Dashboard from './pages/Dashboard';
import SongLibrary from './pages/SongLibrary';
import SongForm from './pages/SongForm';
import SongDetail from './pages/SongDetail';
import LineupList from './pages/LineupList';
import LineupForm from './pages/LineupForm';
import LineupView from './pages/LineupView';
import LyricsMonitorPage from './pages/LyricsMonitorPage';
import PrintExportView from './pages/PrintExportView';

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-slate-900">
      <Navbar />
      <InstallBanner />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/songs" element={<SongLibrary />} />
        <Route path="/songs/new" element={<SongForm />} />
        <Route path="/songs/add" element={<Navigate to="/songs/new" replace />} />
        <Route path="/songs/:id" element={<SongDetail />} />
        <Route path="/songs/:id/edit" element={<SongForm />} />
        <Route path="/lyrics-monitor/:songId" element={<LyricsMonitorPage />} />
        <Route path="/lineups" element={<LineupList />} />
        <Route path="/lineups/new" element={<LineupForm />} />
        <Route path="/lineups/:id" element={<LineupView />} />
        <Route path="/lineups/:id/edit" element={<LineupForm />} />
        <Route path="/lineups/:id/monitor" element={<LyricsMonitorPage />} />
        <Route path="/lineups/:id/print" element={<PrintExportView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
