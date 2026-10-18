import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

const LINKS = [
  { label: "Classificação", href: "/brasileirao/classificacao" },
  { label: "Jogos", href: "/brasileirao/jogos" },
  { label: "Simulador", href: "/brasileirao/simulador" },
  { label: "Sobre", href: "/sobre" },
  { label: "Contato", href: "/contato" },
  { label: "Privacidade", href: "/politica-de-privacidade" },
  { label: "Cookies", href: "/cookies" },
  { label: "Termos", href: "/termos" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-graphite">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display font-bold uppercase text-white">{siteConfig.siteName}</p>
            <p className="text-xs text-muted-2">Brasileirão Série A</p>
          </div>
          <nav aria-label="Links do rodapé" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="text-xs text-muted-2">
          {siteConfig.siteName} é um projeto independente e não possui vínculo oficial com a CBF ou os clubes
          apresentados.
        </p>
      </div>
    </footer>
  );
}
