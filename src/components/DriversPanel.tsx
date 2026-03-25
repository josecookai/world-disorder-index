type Props = {
  drivers: string[];
  summary: string;
};

export function DriversPanel({ drivers, summary }: Props) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-zinc-900">本周驱动因素</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
        {drivers.map((driver) => (
          <li key={driver}>{driver}</li>
        ))}
      </ul>
      <p className="mt-4 border-l-2 border-zinc-300 pl-3 text-sm text-zinc-600">{summary}</p>
    </section>
  );
}
