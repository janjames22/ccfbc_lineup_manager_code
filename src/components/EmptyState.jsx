export default function EmptyState({ title, message, action }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
