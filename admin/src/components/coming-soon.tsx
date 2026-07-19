export default function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">{title}</h1>
      <div className="rounded-xl bg-white p-10 text-center text-slate-400 shadow-sm">
        This section is planned for the next phase. Data model is already in the
        database — the management UI will be built here.
      </div>
    </div>
  );
}
