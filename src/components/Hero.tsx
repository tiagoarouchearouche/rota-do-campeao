import { TeamSearch } from "@/components/TeamSearch";

export function Hero() {
  return (
    <section
      id="simular-meu-time"
      className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-emerald-950 px-6 py-12 text-center text-white sm:px-10 sm:py-16"
    >
      <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
        Descubra o caminho do seu time até o título
      </h1>
      <p className="max-w-xl text-emerald-50/90 sm:text-lg">
        Consulte tabelas reais, veja jogos restantes e simule cenários de título, classificação e fuga do
        rebaixamento.
      </p>
      <TeamSearch variant="hero" />
      <div className="flex flex-wrap justify-center gap-2 text-xs text-emerald-100/80">
        <span className="rounded-full bg-white/10 px-3 py-1">📊 Tabelas reais</span>
        <span className="rounded-full bg-white/10 px-3 py-1">📅 Jogos restantes</span>
        <span className="rounded-full bg-white/10 px-3 py-1">🏆 Cenários de título</span>
        <span className="rounded-full bg-white/10 px-3 py-1">⚠️ Fuga do rebaixamento</span>
        <span className="rounded-full bg-white/10 px-3 py-1">💬 Compartilhe no WhatsApp</span>
      </div>
    </section>
  );
}
