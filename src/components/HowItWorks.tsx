import { Search, ListChecks, Target } from "lucide-react";

const STEPS = [
  { Icon: Search, title: "Escolha seu time", body: "Digite o nome do seu time na busca do topo." },
  { Icon: ListChecks, title: "Consulte a situação atual", body: "Veja posição, pontos e jogos restantes na tabela." },
  { Icon: Target, title: "Simule o caminho até o objetivo", body: "Título, classificação ou fuga do rebaixamento — em três cenários." },
];

export function HowItWorks({ id }: { id?: string }) {
  return (
    <section id={id} className="flex flex-col gap-5">
      <h2 className="font-display text-xl font-bold uppercase text-white">Como funciona</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STEPS.map(({ Icon, title, body }, index) => (
          <div key={title} className="flex flex-col gap-2 rounded-md border border-border bg-graphite p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-lime text-ink">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="font-display text-sm text-muted-2">Passo {index + 1}</span>
            </div>
            <h3 className="font-display text-base font-bold text-white">{title}</h3>
            <p className="text-sm text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
