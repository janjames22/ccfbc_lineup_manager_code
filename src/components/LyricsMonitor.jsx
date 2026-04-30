import { ChevronLeft, ChevronRight, Maximize } from 'lucide-react';

export default function LyricsMonitor({ title, keyName, sections, index, onIndexChange, backAction }) {
  const safeSections = sections?.length ? sections : [{ section: 'No Sections', text: 'No lyrics monitor text or cues added yet.', vocalNotes: '', repeatCount: '' }];
  const currentIndex = Math.min(index, safeSections.length - 1);
  const current = safeSections[currentIndex];

  const go = (delta) => onIndexChange(Math.max(0, Math.min(safeSections.length - 1, currentIndex + delta)));
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 print:hidden">
        <div>
          <p className="text-sm font-medium text-amber-300">{keyName ? `Key: ${keyName}` : 'Lyrics Monitor'}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input bg-white text-slate-950" value={currentIndex} onChange={(event) => onIndexChange(Number(event.target.value))}>
            {safeSections.map((section, sectionIndex) => (
              <option key={`${section.section}-${sectionIndex}`} value={sectionIndex}>
                {section.section || `Section ${sectionIndex + 1}`}
              </option>
            ))}
          </select>
          <button className="btn-dark" type="button" onClick={toggleFullscreen} title="Fullscreen">
            <Maximize size={18} aria-hidden="true" /> Fullscreen
          </button>
          {backAction}
        </div>
      </div>

      <section className="grid flex-1 place-items-center px-4 py-10 text-center">
        <div className="w-full max-w-5xl">
          <p className="mb-6 text-xl font-semibold uppercase text-amber-300">{current.section}</p>
          <pre className="whitespace-pre-wrap font-sans text-3xl font-bold leading-tight sm:text-5xl">{current.text || 'No cue text for this section.'}</pre>
          {current.vocalNotes && <p className="mt-8 text-xl text-slate-200">{current.vocalNotes}</p>}
          {current.repeatCount && <p className="mt-3 text-lg text-slate-300">Repeat: {current.repeatCount}</p>}
        </div>
      </section>

      <div className="flex items-center justify-between border-t border-white/10 px-4 py-4 sm:px-6 print:hidden">
        <button className="btn-dark" type="button" onClick={() => go(-1)} disabled={currentIndex === 0}>
          <ChevronLeft size={20} aria-hidden="true" /> Previous
        </button>
        <span className="text-sm text-slate-300">
          {currentIndex + 1} / {safeSections.length}
        </span>
        <button className="btn-dark" type="button" onClick={() => go(1)} disabled={currentIndex === safeSections.length - 1}>
          Next <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </main>
  );
}
