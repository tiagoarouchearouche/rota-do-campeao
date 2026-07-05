import Link from "next/link";

const DEFAULT_COMPETITION = "brasileirao-serie-a";

const NAV_LINKS = [
  { label: "Competições", href: "/" },
  { label: "Simular meu time", href: "/#simular-meu-time" },
  { label: "Tabelas", href: `/competicao/${DEFAULT_COMPETITION}?tab=classificacao` },
  { label: "Copa 2026", href: "/copa-do-mundo-2026" },
  { label: "Como funciona", href: "/#como-funciona" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-emerald-900/40 bg-emerald-950 text-white shadow-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500 text-sm text-emerald-950">
            🏆
          </span>
          <span className="text-lg">Rota do Campeão</span>
        </Link>

        <nav className="flex flex-1 items-center gap-1 overflow-x-auto text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 font-medium text-emerald-100 transition hover:bg-emerald-900 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#simular-meu-time"
          className="shrink-0 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-bold text-emerald-950 transition hover:bg-amber-300"
        >
          Simular agora
        </Link>
      </div>
    </header>
  );
}
