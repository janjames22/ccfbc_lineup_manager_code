import { MUSICIAN_FIELDS } from '../utils/constants';

export default function TeamAssignments({ musicians, onChange, readOnly = false }) {
  if (readOnly) {
    const filled = MUSICIAN_FIELDS.filter(([key]) => musicians?.[key]);
    if (!filled.length) return <p className="text-sm text-slate-500">No team assignments yet.</p>;

    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filled.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-slate-200 bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase text-blue-700">{label}</p>
            <p className="mt-1 font-semibold text-slate-950">{musicians[key]}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MUSICIAN_FIELDS.map(([key, label]) => (
        <label key={key} className="block">
          <span className="label">{label}</span>
          <input
            className="input"
            value={musicians[key] || ''}
            onChange={(event) => onChange(key, event.target.value)}
            placeholder="Name"
          />
        </label>
      ))}
    </div>
  );
}
