import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LyricsMonitor from '../components/LyricsMonitor';
import { getLineupById, getSongById } from '../utils/storage';

export default function LyricsMonitorPage() {
  const { id, songId } = useParams();
  const [index, setIndex] = useState(0);

  const monitorData = useMemo(() => {
    if (songId) {
      const song = getSongById(songId);
      return {
        title: song?.title || 'Song Monitor',
        keyName: song?.selectedKey || song?.originalKey || '',
        sections: song?.lyricsMonitor || [],
        backTo: song ? `/songs/${song.id}` : '/songs',
      };
    }

    const lineup = getLineupById(id);
    const sections = lineup?.songs.flatMap((lineupSong) => {
      const song = getSongById(lineupSong.songId);
      const cues = song?.lyricsMonitor?.length ? song.lyricsMonitor : [{ section: 'Song Cue', text: lineupSong.notes || 'No cue text added.', vocalNotes: '', repeatCount: '' }];
      return cues.map((cue) => ({
        ...cue,
        section: `${lineupSong.title} - ${cue.section}`,
        songTitle: lineupSong.title,
        keyName: lineupSong.selectedKey,
      }));
    }) || [];
    const current = sections[index] || sections[0];
    return {
      title: current?.songTitle || 'Sunday Lineup Monitor',
      keyName: current?.keyName || lineup?.serviceTime || '',
      sections,
      backTo: lineup ? `/lineups/${lineup.id}` : '/lineups',
    };
  }, [id, songId, index]);

  return (
    <LyricsMonitor
      title={monitorData.title}
      keyName={monitorData.keyName}
      sections={monitorData.sections}
      index={index}
      onIndexChange={setIndex}
      backAction={<Link className="btn-dark" to={monitorData.backTo}><ArrowLeft size={18} aria-hidden="true" /> Back</Link>}
    />
  );
}
