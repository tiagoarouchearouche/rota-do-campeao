import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description: `Termos de uso do ${siteConfig.siteName}.`,
  alternates: { canonical: "/termos" },
};

export default function TermosPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Termos" }]} />

      <div className="mt-4 flex flex-col gap-4 text-sm text-muted">
        <h1 className="font-display text-2xl font-bold uppercase text-white">Termos de Uso</h1>

        <h2 className="font-display text-base font-bold uppercase text-white">Finalidade informativa</h2>
        <p>
          O {siteConfig.siteName} é uma ferramenta informativa e de simulação sobre o Brasileirão Série A. O
          conteúdo não substitui os canais oficiais da CBF ou dos clubes.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Dados podem sofrer alterações</h2>
        <p>
          A classificação, os jogos e os demais dados exibidos dependem de fontes externas e podem estar
          desatualizados, incompletos ou indisponíveis em determinados momentos.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Simulações não são previsões garantidas</h2>
        <p>
          Os cenários e o simulador de campeonato são estimativas matemáticas baseadas na tabela e nos jogos
          restantes. Eles não são previsões oficiais, não garantem resultados futuros e não devem ser usados como
          única base para decisões.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Responsabilidade</h2>
        <p>
          O uso do site é de responsabilidade do usuário. Não nos responsabilizamos por decisões tomadas com base
          nas informações ou simulações apresentadas.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Propriedade intelectual</h2>
        <p>
          Os textos, cálculos e a interface do {siteConfig.siteName} são de seus respectivos autores. Nomes e
          escudos de clubes pertencem às respectivas entidades e são usados apenas para fins de identificação.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Uso dos conteúdos</h2>
        <p>Reprodução do conteúdo deste site sem autorização não é permitida.</p>
      </div>
    </main>
  );
}
