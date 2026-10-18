import Link from "next/link";

export function Hero({
  round,
  totalRounds,
  updatedAt,
}: {
  round?: number | null;
  totalRounds?: number | null;
  updatedAt?: string;
}) {
  const roundLabel = round && totalRounds ? `Rodada ${round} de ${totalRounds}` : null;
  const updatedLabel = updatedAt
    ? new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(updatedAt))
    : null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-graphite to-ink px-4 py-16 sm:py-24">
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
        <span className="rounded-md bg-lime px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">
          Brasileirão Série A
        </span>

        {(roundLabel || updatedLabel) && (
          <p className="text-xs text-muted-2">
            {roundLabel}
            {roundLabel && updatedLabel ? " · " : ""}
            {updatedLabel ? `Última atualização: ${updatedLabel}` : ""}
          </p>
        )}

        <h1 className="font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-6xl">
          O caminho do seu time no <span className="text-lime">Brasileirão</span>.
        </h1>
        <p className="max-w-xl text-base text-muted sm:text-lg">
          Acompanhe a classificação, veja os jogos restantes e descubra o que seu clube precisa para atingir seu
          objetivo.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="#meu-time" className="rounded-md bg-lime px-6 py-3 text-sm font-bold text-ink hover:bg-lime-dark">
            Escolher meu time
          </Link>
          <Link
            href="#classificacao"
            className="rounded-md border border-border px-6 py-3 text-sm font-bold text-white hover:bg-surface"
          >
            Ver classificação
          </Link>
        </div>
      </div>
    </section>
  );
}
