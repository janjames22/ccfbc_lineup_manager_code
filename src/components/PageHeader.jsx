export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-blue-700">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-2.5 max-w-2xl text-base text-slate-600 leading-relaxed">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">{actions}</div>}
    </div>
  );
}
