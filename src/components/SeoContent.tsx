export type SeoBlock = {
  title: string;
  body: string;
};

export function SeoContent({ blocks, id }: { blocks: SeoBlock[]; id?: string }) {
  return (
    <section id={id} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Como funciona o simulador</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {blocks.map((block) => (
          <div
            key={block.title}
            className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <h3 className="mb-1.5 font-semibold">{block.title}</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{block.body}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Os cenários e caminhos apresentados são estimativas matemáticas baseadas na tabela e nos jogos restantes —
        não são previsões oficiais nem substituem os critérios de desempate e regulamentos de cada competição.
      </p>
    </section>
  );
}
