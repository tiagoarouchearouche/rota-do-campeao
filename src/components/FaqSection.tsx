export type FaqItem = {
  question: string;
  answer: string;
};

export function FaqSection({ items, id }: { items: FaqItem[]; id?: string }) {
  return (
    <section id={id} className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Perguntas frequentes</h2>
      <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {items.map((item) => (
          <details key={item.question} className="group px-4 py-3">
            <summary className="cursor-pointer list-none font-medium marker:content-none">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span className="text-neutral-400 transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
