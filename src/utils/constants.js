export const KEYS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

export const SECTION_TYPES = [
  'Intro',
  'Verse 1',
  'Verse 2',
  'Pre-Chorus',
  'Chorus',
  'Bridge',
  'Instrumental',
  'Ending',
];

export const MUSICIAN_FIELDS = [
  ['keyboard', 'Keyboard'],
  ['acousticGuitar', 'Acoustic Guitar'],
  ['electricGuitar', 'Electric Guitar'],
  ['bass', 'Bass'],
  ['drums', 'Drums'],
  ['multimedia', 'Multimedia'],
  ['vocals_1', 'Vocals 1'],
  ['vocals_2', 'Vocals 2'],
  ['vocals_3', 'Vocals 3'],
];

export const emptyMusicians = () =>
  MUSICIAN_FIELDS.reduce((acc, [key]) => ({ ...acc, [key]: '' }), {});

export function formatBpm(value) {
  if (!value) return '-';
  const text = String(value).trim();
  return /\bbpm\b/i.test(text) ? text : `${text} BPM`;
}
