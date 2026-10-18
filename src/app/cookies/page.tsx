import type { Metadata } from "next";
import { siteConfig } from "@/lib/siteConfig";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Política de Cookies",
  description: `Como o ${siteConfig.siteName} usa cookies.`,
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Cookies" }]} />

      <div className="mt-4 flex flex-col gap-4 text-sm text-muted">
        <h1 className="font-display text-2xl font-bold uppercase text-white">Política de Cookies</h1>
        <p>
          Cookies são pequenos arquivos guardados pelo seu navegador. O {siteConfig.siteName} organiza seu uso de
          cookies em três categorias:
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Necessários</h2>
        <p>Garantem o funcionamento básico do site (como lembrar sua escolha de cookies). Não podem ser desativados.</p>

        <h2 className="font-display text-base font-bold uppercase text-white">Análise</h2>
        <p>
          Podem ser usados (via Google Analytics, quando ativado) para entender como as páginas são usadas e onde
          melhorar o site. Só são carregados se você aceitar essa categoria.
        </p>

        <h2 className="font-display text-base font-bold uppercase text-white">Publicidade</h2>
        <p>
          Podem ser usados (via Google AdSense, quando ativado) para exibir anúncios relevantes. Só são carregados
          se você aceitar essa categoria.
        </p>

        <p>
          Você pode ajustar sua escolha a qualquer momento no banner de cookies exibido no site, ou limpando os
          dados do site nas configurações do seu navegador.
        </p>
      </div>
    </main>
  );
}
