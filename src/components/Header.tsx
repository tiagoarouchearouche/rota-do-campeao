"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Trophy } from "lucide-react";

const NAV_LINKS = [
  { label: "Competições", href: "/#competicoes" },
  { label: "Como funciona", href: "/#como-funciona" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-graphite/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-lime text-ink">
            <Trophy size={18} strokeWidth={2.5} aria-hidden="true" />
          </span>
          Rota do Campeão
        </Link>

        <nav aria-label="Navegação principal" className="hidden items-center gap-1 text-sm sm:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-md px-3 py-2 font-medium text-muted transition hover:bg-surface hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/#simular"
            className="hidden shrink-0 rounded-md bg-lime px-4 py-2 text-sm font-bold text-ink transition hover:bg-lime-dark sm:inline-block"
          >
            Simular agora
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-border text-white sm:hidden"
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Navegação principal (mobile)"
          className="flex flex-col gap-1 border-t border-border bg-graphite px-4 py-3 sm:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-muted hover:bg-surface hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#simular"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-md bg-lime px-4 py-3 text-center text-base font-bold text-ink"
          >
            Simular agora
          </Link>
        </nav>
      )}
    </header>
  );
}
