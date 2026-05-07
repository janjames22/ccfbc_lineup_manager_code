import { X, Download } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem('dismissInstallBanner') === 'true') {
      return;
    }

    // Check if already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      return;
    }

    // Detect iOS Safari
    const ua = window.navigator.userAgent;
    const isIPad = !!ua.match(/iPad/i);
    const isIPhone = !!ua.match(/iPhone/i);
    const isWebKit = !!ua.match(/WebKit/i);
    const isIOSDevice = isIPad || isIPhone;
    
    if (isIOSDevice && isWebKit && !ua.match(/CriOS/i)) {
      setIsIOS(true);
      setIsVisible(true);
    }

    // Handle standard PWA install prompt (Android / Desktop Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('dismissInstallBanner', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 animate-slide-up print:hidden sm:bottom-6 sm:left-6 sm:right-auto sm:w-[400px]">
      <div className="relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10 backdrop-blur-xl">
        {/* Progress bar or decorative element */}
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-600 to-indigo-600"></div>

        <button
          onClick={handleDismiss}
          className="absolute right-3 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-white transition-all"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>
        
        <div className="flex flex-col gap-5 pr-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 size-14 rounded-2xl bg-slate-800 p-1.5 shadow-inner ring-1 ring-white/10">
              <img src="/logo.png" alt="App Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white leading-tight">Install App</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Line Up Manager</p>
            </div>
          </div>

          <p className="text-sm font-medium text-slate-300 leading-relaxed">
            Get the full mobile experience with <span className="text-white font-bold">offline access</span>, better performance, and a dedicated home screen icon.
          </p>
          
          {isIOS ? (
            <div className="mt-1 rounded-2xl bg-blue-950/40 px-4 py-3.5 text-sm font-bold text-blue-200 border border-blue-900/50 flex items-center gap-3">
              <span className="text-2xl">☝️</span>
              <span>Tap <span className="text-white underline decoration-blue-500">Share</span> then <span className="text-white">Add to Home Screen</span></span>
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-black text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={20} strokeWidth={3} />
              Add to Home Screen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
