const sharpScale = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const flatScale = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const flatKeys = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cm', 'Fm', 'Bbm', 'Ebm']);
const chordPattern = /^([A-G](?:#|b)?)([^/\s]*)(?:\/([A-G](?:#|b)?))?$/;
const chordTokenPattern = /(?<![A-Za-z])([A-G](?:#|b)?(?:m|maj|min|sus|add|dim|aug|ø|\d|\/|#|b|[().+-])*)(?![A-Za-z])/g;

function prefersFlats(value = '') {
  return value.includes('b') || flatKeys.has(value);
}

function transposeNote(note, semitones, useFlats) {
  const sourceScale = flatScale.includes(note) ? flatScale : sharpScale;
  const noteIndex = sourceScale.indexOf(note);
  if (noteIndex === -1) return note;
  const newIndex = (noteIndex + semitones + 1200) % 12;
  return (useFlats ? flatScale : sharpScale)[newIndex];
}

function transposeChord(chord, semitones) {
  const match = chord.match(chordPattern);
  if (!match) return chord;
  const [, root, quality = '', bass] = match;
  const useFlats = prefersFlats(root) || prefersFlats(bass);
  const nextRoot = transposeNote(root, semitones, useFlats);
  const nextBass = bass ? `/${transposeNote(bass, semitones, useFlats)}` : '';
  return `${nextRoot}${quality}${nextBass}`;
}

function isChordLine(line) {
  const withoutHeader = line.replace(/^\s*(Intro|Verse\s*\d*|Pre-Chorus|Chorus|Bridge|Instrumental|Ending|Tag|Outro|Interlude)\s*:?\s*/i, '');
  const tokens = withoutHeader.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const chordCount = tokens.filter((token) => chordPattern.test(token.replace(/[|,]/g, ''))).length;
  return chordCount > 0 && chordCount / tokens.length >= 0.6;
}

export function transposeChords(chart, semitones) {
  if (!chart || semitones === 0) return chart || '';

  return chart
    .split('\n')
    .map((line) => {
      if (!line.trim()) return line;

      if (isChordLine(line)) {
        return line.replace(chordTokenPattern, (match) => transposeChord(match, semitones));
      }

      return line.replace(/\[([^\]]+)\]/g, (_match, chord) => `[${transposeChord(chord, semitones)}]`);
    })
    .join('\n');
}

export function getTransposedKey(key, semitones) {
  if (!key) return key;
  return transposeNote(key, semitones, prefersFlats(key));
}

export function getKeys() {
  return ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
}

export function getSemitoneDelta(fromKey, toKey) {
  const fromIndex = sharpScale.indexOf(transposeNote(fromKey, 0, false));
  const toIndex = sharpScale.indexOf(transposeNote(toKey, 0, false));
  if (fromIndex === -1 || toIndex === -1) return 0;
  let delta = toIndex - fromIndex;
  if (delta > 6) delta -= 12;
  if (delta < -6) delta += 12;
  return delta;
}
