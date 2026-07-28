import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center gap-6 px-4 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger/15 text-danger">
        <ShieldAlert size={28} aria-hidden="true" />
      </span>
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted">Essa competição ou time não existe, ou o link está desatualizado.</p>
      </div>
      <Link href="/" className="rounded-md bg-lime px-4 py-2 text-sm font-bold text-ink hover:bg-lime-dark">
        Voltar ao início
      </Link>
    </main>
  );
}
