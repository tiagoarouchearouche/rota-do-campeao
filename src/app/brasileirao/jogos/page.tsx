import type { Metadata } from "next";
import { getFixtures } from "@/services/sportsData/sportsDataService";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { buildBreadcrumbJsonLd } from "@/lib/jsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FixturesList } from "@/components/FixturesList";

export const metadata: Metadata = {
  title: "Jogos do Brasileirão Série A",
  description: "Últimos resultados e próximos jogos do Brasileirão Série A, organizados por rodada.",
  alternates: { canonical: "/brasileirao/jogos" },
};

export default async function JogosPage() {
  const { data: fixtures } = await getFixtures(BRASILEIRAO_COMPETITION_ID);
  const finished = fixtures.filter((f) => f.status === "finished");
  const upcoming = fixtures.filter((f) => f.status !== "finished");

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Rota do Campeão", path: "/" },
    { name: "Jogos", path: "/brasileirao/jogos" },
  ]);

  return (
    <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Jogos" }]} />

      <div className="mt-4 flex flex-col gap-8">
        <h1 className="font-display text-2xl font-bold uppercase text-white">Jogos do Brasileirão Série A</h1>

        <section id="proximos-jogos" className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold uppercase text-white">Próximos jogos</h2>
          <FixturesList fixtures={upcoming} />
        </section>

        <section id="ultimos-resultados" className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold uppercase text-white">Últimos resultados</h2>
          <FixturesList fixtures={finished} />
        </section>
      </div>
    </main>
  );
}
