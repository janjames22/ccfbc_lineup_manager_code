import { CloudDownload, Check } from 'lucide-react';
import { useState } from 'react';
import { useOffline } from '../hooks/useOffline';

export default function DownloadOfflineButton({ onDownload, label = 'Download Offline' }) {
  const isOffline = useOffline();
  const [status, setStatus] = useState('idle'); // idle, downloading, success, error

  const handleDownload = async () => {
    if (isOffline) return;
    setStatus('downloading');
    try {
      await onDownload();
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Download failed:', err);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (isOffline) return null;

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'downloading'}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] ${
        status === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
        status === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
        'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
      }`}
    >
      {status === 'success' ? <Check size={18} /> : <CloudDownload size={18} className={status === 'downloading' ? 'animate-bounce' : ''} />}
      {status === 'downloading' ? 'Downloading...' : status === 'success' ? 'Saved' : status === 'error' ? 'Failed' : label}
    </button>
  );
}
