import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { siteConfig } from "@/lib/siteConfig";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = {
  title: "Contato",
  description: `Entre em contato com o ${siteConfig.siteName}.`,
  alternates: { canonical: "/contato" },
};

export default function ContatoPage() {
  return (
    <main id="main-content" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
      <Breadcrumbs items={[{ name: "Rota do Campeão", path: "/" }, { name: "Contato" }]} />

      <div className="mt-4 flex flex-col gap-4">
        <h1 className="font-display text-2xl font-bold uppercase text-white">Contato</h1>
        <p className="text-sm text-muted">
          Encontrou um dado incorreto, tem uma sugestão ou quer falar com a equipe do {siteConfig.siteName}?
        </p>

        {siteConfig.contactEmail ? (
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className="inline-flex items-center gap-2 self-start rounded-md bg-lime px-4 py-2 text-sm font-bold text-ink hover:bg-lime-dark"
          >
            <Mail size={16} aria-hidden="true" />
            {siteConfig.contactEmail}
          </a>
        ) : (
          <p className="rounded-md border border-border bg-graphite p-4 text-sm text-muted-2">
            O e-mail de contato ainda não foi configurado. Defina a variável de ambiente
            <code className="ml-1 rounded bg-surface px-1.5 py-0.5 text-xs">NEXT_PUBLIC_CONTACT_EMAIL</code> para
            exibi-lo aqui.
          </p>
        )}
      </div>
    </main>
  );
}
