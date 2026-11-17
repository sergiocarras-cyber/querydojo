export function PlaceholderPage({ title, phase }: { title: string; phase: number }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-ink-100">{title}</h1>
      <p className="mt-3 text-ink-400">
        Llega en la fase {phase}. <span className="font-mono text-ink-500">// TODO</span>
      </p>
    </div>
  );
}
