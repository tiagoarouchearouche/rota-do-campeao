import { TeamSearch } from "@/components/TeamSearch";

export function Hero() {
  return (
    <section
      id="simular"
      className="relative overflow-hidden bg-gradient-to-b from-graphite to-ink px-4 py-16 sm:py-24"
    >
      {/* Formas geométricas angulares — só decoração, sem conteúdo semântico */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-0 h-full w-1/2 bg-lime/10"
        style={{ clipPath: "polygon(30% 0, 100% 0, 100% 100%, 0 100%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 top-1/3 h-40 w-40 rotate-12 bg-lime/20"
        style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <h1 className="font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl">
          Descubra o caminho do seu time até <span className="text-lime">o título</span>.
        </h1>
        <p className="max-w-xl text-base text-muted sm:text-lg">
          Consulte a tabela, veja os jogos restantes e simule os cenários do seu time no campeonato.
        </p>

        <div className="mt-2 w-full">
          <TeamSearch variant="hero" />
        </div>
      </div>
    </section>
  );
}
