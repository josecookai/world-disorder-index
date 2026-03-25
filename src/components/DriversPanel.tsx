type Props = {
  drivers: string[];
  summary: string;
};

export function DriversPanel({ drivers, summary }: Props) {
  return (
    <section className="rounded-xl bg-gdi-surface-low p-8">
      <h2 className="font-headline text-sm font-bold uppercase tracking-widest">Market Context</h2>
      <p className="mt-4 text-sm leading-relaxed text-gdi-on-surface">{summary}</p>
      <ul className="mt-6 space-y-3 text-sm text-gdi-secondary">
        {drivers.map((driver) => (
          <li key={driver} className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gdi-danger" />
            <span className="text-xs leading-tight">{driver}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
