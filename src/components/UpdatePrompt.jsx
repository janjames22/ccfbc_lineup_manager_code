import { RefreshCw, X } from 'lucide-react';

export default function UpdatePrompt({ onUpdate, onDismiss }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-8 shadow-[0_30px_60px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
        <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 animate-pulse"></div>
        
        <div className="flex flex-col items-center text-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
            <div className="relative grid size-20 place-items-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-900/40">
              <RefreshCw size={40} strokeWidth={2.5} className="animate-spin-slow" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">New Update Available</h2>
            <p className="text-slate-400 font-medium">
              A new version of <span className="text-white font-bold">Line Up Manager</span> is ready. Update now to get the latest features and improvements.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            <button
              onClick={onUpdate}
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 text-lg font-black text-white shadow-lg shadow-blue-900/20 transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              Update Now
            </button>
            <button
              onClick={onDismiss}
              className="text-sm font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
