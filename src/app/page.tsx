import Link from "next/link";
import { getCompetitions } from "@/services/sportsData/sportsDataService";
import { CompetitionStatusBadge } from "@/components/CompetitionStatusBadge";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { ApiWarningBanner } from "@/components/ApiWarningBanner";
import { DataStatusPanel } from "@/components/DataStatusPanel";
import { Hero } from "@/components/Hero";
import { AdSlot } from "@/components/AdSlot";
import { SeoContent, type SeoBlock } from "@/components/SeoContent";
import { FaqSection, type FaqItem } from "@/components/FaqSection";
import type { Competition } from "@/services/sportsData/types";

const SEO_BLOCKS: SeoBlock[] = [
  {
    title: "Como funciona o simulador de caminho até o título",
    body: "A ferramenta cruza a tabela de classificação atual com os jogos restantes de cada time para estimar quantos pontos faltam até a linha de corte do título, considerando os confrontos diretos contra os principais rivais.",
  },
  {
    title: "Como calcular se um time ainda pode ser campeão",
    body: "Somamos os pontos atuais aos pontos máximos possíveis nos jogos restantes (3 por vitória) e comparamos com a pontuação projetada do líder mais uma margem de segurança que diminui conforme a competição avança.",
  },
  {
    title: "Como saber quantos pontos faltam para não cair",
    body: "Identificamos o time na última posição fora da zona de rebaixamento e calculamos a diferença de pontos até ele, acrescida de uma margem — esse é o alvo mínimo para escapar do descenso.",
  },
  {
    title: "Como simular os jogos restantes do campeonato",
    body: "Na aba Simulação você escolhe um time e vê três cenários — otimista, realista e pessimista — cada um com uma taxa diferente de vitórias, empates e derrotas aplicada aos jogos que faltam.",
  },
  {
    title: "Como ver em quais campeonatos meu time está",
    body: "Digite o nome do time na busca do topo — a aplicação mostra em quais competições disponíveis pela football-data.org ele aparece, e você escolhe onde simular.",
  },
  {
    title: "Dados oficiais e limitações da simulação",
    body: "A fonte principal de dados é a football-data.org. Quando a chave está configurada, os dados são reais; se uma competição não estiver acessível no plano atual ou a API falhar, mostramos dados demonstrativos claramente sinalizados. A simulação é uma estimativa matemática, não uma previsão oficial.",
  },
];

const FAQ_ITEMS: FaqItem[] = [
  { question: "O site usa dados reais?", answer: "Sim. A fonte principal de dados é a football-data.org, atualizada em cache a cada 30 minutos por padrão." },
  {
    question: "Qual é a fonte dos dados?",
    answer: "football-data.org. Quando não é possível confirmar dados reais para uma competição, o site usa dados demonstrativos e sinaliza isso com o badge \"Fonte: Demonstração\".",
  },
  {
    question: "Por que algumas competições não aparecem?",
    answer:
      "Só listamos competições que a football-data.org realmente disponibiliza no plano configurado. Competições ainda não confirmadas ficam em \"Outras competições em análise\", sem dados reais até serem validadas.",
  },
  {
    question: "A Copa do Mundo 2026 já tem dados reais?",
    answer:
      "Depende da fase do torneio na football-data.org: mostramos a tabela de grupos real quando disponível, o calendário de jogos quando só isso estiver pronto, ou uma simulação pré-torneio claramente sinalizada quando nenhum dos dois estiver.",
  },
  {
    question: "Como simular meu time?",
    answer: "Digite o nome do time na busca no topo da página. A aplicação mostra em quais competições disponíveis ele está e você escolhe onde simular.",
  },
  {
    question: "Como saber se meu time pode ser campeão?",
    answer: "Na página do time, o card \"Caminho para o título\" mostra quantos pontos faltam e quantas vitórias isso representa.",
  },
  {
    question: "Como saber se meu time pode ser rebaixado?",
    answer: "O card \"Caminho para não cair\" mostra a distância até a zona seguro, calculada a partir do último time fora do rebaixamento.",
  },
  {
    question: "Posso compartilhar minha simulação?",
    answer: "Sim — por link, WhatsApp ou baixando um card em imagem com o resumo da sua simulação.",
  },
];

export default async function HomePage() {
  const { data: allCompetitions, source, isMock, updatedAt, showTechnicalStatus } = await getCompetitions({
    showUnavailable: true,
  });

  const primary = allCompetitions.filter((c) => c.status === "available");
  const secondary = allCompetitions.filter((c) => c.status !== "available");

  const byContinent = primary.reduce<Record<string, Competition[]>>((acc, competition) => {
    const key = competition.continent ?? "Outros";
    acc[key] = acc[key] ? [...acc[key], competition] : [competition];
    return acc;
  }, {});

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-8">
      <Hero />

      <AdSlot type="leaderboard" />

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <DataSourceBadge source={source} />
        </div>
        <ApiWarningBanner isMock={isMock} showTechnicalStatus={showTechnicalStatus} />
        <DataStatusPanel source={source} updatedAt={updatedAt} isMock={isMock} showTechnicalStatus={showTechnicalStatus} />

        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">Escolha uma competição</h2>
          {Object.entries(byContinent).map(([continent, list]) => (
            <div key={continent} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {continent}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((competition) => (
                  <Link
                    key={competition.id}
                    href={`/competicao/${competition.id}`}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-400 hover:shadow dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-700"
                  >
                    <div>
                      <p className="font-medium">{competition.name}</p>
                      {competition.country && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{competition.country}</p>
                      )}
                    </div>
                    <CompetitionStatusBadge competition={competition} />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="flex flex-col gap-3 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌎</span>
            <h2 className="text-xl font-bold">Copa do Mundo 2026</h2>
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Grupos, calendário de jogos e simulação de cenários para o torneio de 48 seleções — com aviso claro
            sobre a origem dos dados em cada fase.
          </p>
          <Link
            href="/copa-do-mundo-2026"
            className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Ver Copa do Mundo 2026
          </Link>
        </section>

        {secondary.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Outras competições em análise
            </h2>
            <div className="flex flex-wrap gap-2">
              {secondary.map((competition) => (
                <span
                  key={competition.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 dark:border-neutral-800 dark:text-neutral-400"
                >
                  {competition.name}
                  <CompetitionStatusBadge competition={competition} />
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      <AdSlot type="in-content" />

      <SeoContent id="como-funciona" blocks={SEO_BLOCKS} />

      <AdSlot type="in-content" label="Espaço publicitário" />

      <FaqSection items={FAQ_ITEMS} />

      <AdSlot type="footer" />
    </main>
  );
}
