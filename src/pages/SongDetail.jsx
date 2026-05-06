import { ArrowLeft, Monitor, Pencil, Trash2, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { formatBpm } from '../utils/constants';
import { deleteSong, getSongById } from '../utils/storage';
import { getTransposedKey, transposeChords } from '../utils/transposeChords';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [song, setSong] = useState(null);
  const [transposeAmount, setTransposeAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSong() {
      try {
        const data = await getSongById(id);
        setSong(data);
      } catch (error) {
        console.error("Failed to load songs:", error);
        setSong(null);
      } finally {
        setLoading(false);
      }
    }
    loadSong();
  }, [id]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="text-slate-600">Loading...</p>
      </main>
    );
  }

  if (!song) {
    return (
      <main className="page-shell">
        <p className="text-slate-600">Song not found.</p>
        <Link className="btn-primary mt-4" to="/songs"><ArrowLeft size={18} aria-hidden="true" /> Back to Songs</Link>
      </main>
    );
  }

  const currentKey = getTransposedKey(song.originalKey, transposeAmount);
  const transposedChart = transposeChords(song.chordChart, transposeAmount);

  const remove = async () => {
    if (confirm(`Delete "${song.title}"?`)) {
      await deleteSong(song.id);
      navigate('/songs');
    }
  };

  return (
    <main className="page-shell">
      <PageHeader
        eyebrow="Song Detail"
        title={song.title}
        description={song.artist || 'No artist listed'}
        actions={
          <>
            <Link className="btn-secondary" to="/songs"><ArrowLeft size={18} aria-hidden="true" /> Songs</Link>
            {song.youtubeLink && (
              <a className="btn-secondary text-red-600 hover:border-red-200 hover:bg-red-50" href={song.youtubeLink} target="_blank" rel="noopener noreferrer">
                <Youtube size={18} aria-hidden="true" /> YouTube
              </a>
            )}
            <Link className="btn-secondary" to={`/lyrics-monitor/${song.id}`}><Monitor size={18} aria-hidden="true" /> Monitor</Link>
            <Link className="btn-secondary" to={`/songs/${song.id}/edit`}><Pencil size={18} aria-hidden="true" /> Edit</Link>
            <button className="btn-danger" type="button" onClick={remove}><Trash2 size={18} aria-hidden="true" /> Delete</button>
          </>
        }
      />

      <section className="panel mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Info label="Original Key" value={song.originalKey} />
          <Info label="Current Key" value={currentKey} highlight />
          <Info label="BPM" value={formatBpm(song.tempo)} />
          <Info label="Category" value={song.category || '-'} />
          <Info label="Language" value={song.language || '-'} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <button className="btn-secondary" type="button" onClick={() => setTransposeAmount((value) => Math.max(-12, value - 1))}>-</button>
          <span className="min-w-28 text-center text-lg font-bold">{transposeAmount > 0 ? `+${transposeAmount}` : transposeAmount}</span>
          <button className="btn-secondary" type="button" onClick={() => setTransposeAmount((value) => Math.min(12, value + 1))}>+</button>
          <button className="btn-secondary" type="button" onClick={() => setTransposeAmount(0)}>Reset</button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.65fr]">
        <div className="panel">
          <h2 className="section-title">Chord Chart</h2>
          <pre className="chord-sheet mt-4">{transposedChart || 'No chord chart added yet.'}</pre>
        </div>
        <aside className="space-y-6">
          <div className="panel">
            <h2 className="section-title">Lyrics Monitor Cues</h2>
            <div className="mt-4 space-y-3">
              {song.lyricsMonitor.length ? song.lyricsMonitor.map((section, index) => (
                <div key={`${section.section}-${index}`} className="rounded-lg bg-slate-50 p-4">
                  <p className="font-semibold text-slate-950">{section.section}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{section.text || 'No cue text.'}</p>
                  {section.vocalNotes && <p className="mt-2 text-sm text-blue-700">{section.vocalNotes}</p>}
                </div>
              )) : <p className="text-sm text-slate-600">No lyrics monitor sections added.</p>}
            </div>
          </div>
          {song.notes && (
            <div className="panel">
              <h2 className="section-title">Arrangement Notes</h2>
              <p className="mt-3 whitespace-pre-wrap text-slate-700">{song.notes}</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function Info({ label, value, highlight = false }) {
  return (
    <div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-blue-700' : 'text-slate-950'}`}>{value}</p>
    </div>
  );
}
