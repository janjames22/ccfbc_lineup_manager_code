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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up print:hidden sm:bottom-4 sm:left-4 sm:right-auto sm:w-96">
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-4 shadow-[0_8px_30px_-4px_rgba(37,99,235,0.15)] ring-1 ring-black/5">
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
        
        <div className="flex flex-col gap-3 pr-6">
          <h3 className="text-base font-bold text-slate-900 leading-tight">Install CCFBC Lineup</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Save this app to your phone for quick access, offline songs, and previous lineups.
          </p>
          
          {isIOS ? (
            <div className="mt-1 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-800 border border-blue-100">
              Tap <span className="inline-block rounded border border-blue-200 bg-white px-1 shadow-sm">Share</span>, then <span className="font-bold">Add to Home Screen</span>.
            </div>
          ) : (
            <button
              onClick={handleInstallClick}
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Download size={18} />
              Install App
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
