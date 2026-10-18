import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: `Política de privacidade do ${siteConfig.siteName}.`,
  alternates: { canonical: "/politica-de-privacidade" },
};

export default function PoliticaDePrivacidadePage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Privacidade" }]} />

      <div className="mt-4 flex flex-col gap-4 text-sm text-muted">
        <h1 className="font-display text-2xl font-bold uppercase text-white">Política de Privacidade</h1>
        <p>Esta política explica como o {siteConfig.siteName} trata as informações dos visitantes do site.</p>

        <h2 className="font-display text-base font-bold uppercase text-white">Informações técnicas</h2>
        <p>
          Preferências de navegação, como o time favorito escolhido e o cenário de simulação selecionado, são
          guardadas apenas no seu navegador (localStorage), nunca em um servidor nosso.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Cookies</h2>
        <p>
          Podemos utilizar cookies necessários ao funcionamento do site e, com o seu consentimento, cookies de
          análise e de publicidade. Veja detalhes na nossa{" "}
          <a href="/cookies" className="text-lime hover:underline">
            Política de Cookies
          </a>
          .
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Analytics</h2>
        <p>
          Podemos utilizar o Google Analytics para entender como o site é usado e melhorar a experiência. Esses
          dados, quando coletados, são agregados e não identificam você pessoalmente.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Publicidade</h2>
        <p>
          Podemos exibir anúncios por meio do Google AdSense. O AdSense pode usar cookies para exibir anúncios
          relevantes com base em visitas anteriores a este e a outros sites.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Serviços de terceiros</h2>
        <p>
          Os dados do Brasileirão Série A exibidos aqui vêm da football-data.org. Links externos (como
          compartilhamento no WhatsApp) levam a serviços de terceiros com suas próprias políticas de privacidade.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Seus direitos</h2>
        <p>
          Você pode limpar as preferências salvas no seu navegador a qualquer momento pelas configurações do
          próprio navegador, e pode revisar sua escolha de cookies no banner exibido no site.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Contato</h2>
        <p>
          Dúvidas sobre esta política podem ser enviadas pela página de{" "}
          <a href="/contato" className="text-lime hover:underline">
            Contato
          </a>
          .
        </p>
      </div>
    </main>
  );
}
