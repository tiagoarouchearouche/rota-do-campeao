import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCompetitions } from "@/services/sportsData/sportsDataService";
import { CompetitionStatusBadge } from "@/components/CompetitionStatusBadge";
import { Hero } from "@/components/Hero";
import { AdSlot } from "@/components/AdSlot";
import { HowItWorks } from "@/components/HowItWorks";
import { FaqSection, type FaqItem } from "@/components/FaqSection";

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Os dados são reais?",
    answer:
      "Sim, quando disponíveis: buscamos dados oficiais da football-data.org. Se uma competição não estiver acessível no momento, mostramos dados demonstrativos e avisamos claramente na tela.",
  },
  {
    question: "Qual é a fonte dos dados?",
    answer: "football-data.org. A fonte de cada tabela aparece sempre no topo da página da competição.",
  },
  {
    question: "Como funciona a simulação?",
    answer:
      "Cruzamos a tabela atual com os jogos restantes de cada time para estimar pontos necessários, vitórias mínimas e três cenários: otimista, realista e pessimista.",
  },
  {
    question: "A simulação é uma previsão oficial?",
    answer:
      "Não. São estimativas matemáticas baseadas na tabela e nos jogos restantes — não substituem os critérios oficiais de cada competição.",
  },
  {
    question: "Como compartilhar o resultado?",
    answer: "Na página do seu time, use os botões de compartilhar: copiar link, WhatsApp ou baixar uma imagem-resumo.",
  },
];

export default async function HomePage() {
  const { data: allCompetitions } = await getCompetitions({ showUnavailable: true });
  const available = allCompetitions.filter((c) => c.status === "available");
  const comingSoon = allCompetitions.filter((c) => c.status !== "available");

  return (
    <main id="main-content" className="flex flex-1 flex-col">
      <Hero />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-12">
        <AdSlot placement="hero-banner" />

        <section id="competicoes" className="flex flex-col gap-4">
          <h2 className="font-display text-xl font-bold uppercase text-white">Competições disponíveis</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {available.map((competition) => (
              <Link
                key={competition.id}
                href={`/competicao/${competition.id}`}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-graphite px-4 py-3.5 transition hover:border-lime"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{competition.name}</p>
                  {(competition.country ?? competition.continent) && (
                    <p className="truncate text-xs text-muted">{competition.country ?? competition.continent}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CompetitionStatusBadge competition={competition} />
                  <ChevronRight size={16} className="text-muted-2" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>

          {comingSoon.length > 0 && (
            <details className="group rounded-md border border-border">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-muted marker:content-none">
                <span className="inline-flex items-center gap-1.5">
                  Outras competições chegarão em breve
                  <ChevronRight size={14} className="transition group-open:rotate-90" aria-hidden="true" />
                </span>
              </summary>
              <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                {comingSoon.map((competition) => (
                  <span key={competition.id} className="rounded-md bg-surface px-2.5 py-1 text-xs text-muted">
                    {competition.name}
                  </span>
                ))}
              </div>
            </details>
          )}
        </section>

        <AdSlot placement="content-banner" />

        <HowItWorks id="como-funciona" />

        <FaqSection items={FAQ_ITEMS} />

        <AdSlot placement="footer" />
      </div>
    </main>
  );
}
