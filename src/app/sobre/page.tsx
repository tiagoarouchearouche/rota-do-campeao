import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Sobre",
  description: `Conheça o ${siteConfig.siteName}, uma plataforma independente para acompanhar e simular o Brasileirão Série A.`,
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Sobre" }]} />

      <div className="mt-4 flex flex-col gap-4 text-sm text-muted">
        <h1 className="font-display text-2xl font-bold uppercase text-white">Sobre o {siteConfig.siteName}</h1>

        <p>
          O {siteConfig.siteName} é uma plataforma independente para acompanhamento e simulação do Brasileirão Série
          A. A proposta vai além de mostrar a tabela: o produto explica, com os dados disponíveis, o que cada clube
          precisa fazer nas rodadas restantes para alcançar seus objetivos.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Classificação</h2>
        <p>
          A tabela do Brasileirão Série A é atualizada a partir dos dados oficiais disponíveis, com zonas destacadas
          de título, Libertadores, Sul-Americana e rebaixamento.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Cenários e simulação</h2>
        <p>
          A ferramenta calcula cenários otimista, realista e pessimista para cada time, além de um simulador em que
          o usuário escolhe o resultado dos jogos restantes e vê a tabela recalculada na hora. Essas simulações são
          estimativas matemáticas baseadas na tabela atual — não são previsões oficiais nem garantias de resultado.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Fonte de dados</h2>
        <p>
          Os dados reais vêm da football-data.org. Quando esses dados não estão disponíveis, o site mostra uma
          tabela demonstrativa claramente identificada como tal — nunca apresentamos dados demonstrativos como se
          fossem oficiais.
        </p>

        <p className="mt-4 rounded-md border border-border bg-graphite p-4 text-xs text-muted-2">
          O {siteConfig.siteName} é um projeto independente e não possui vínculo oficial com a CBF, clubes ou
          competições apresentadas.
        </p>
      </div>
    </main>
  );
}
