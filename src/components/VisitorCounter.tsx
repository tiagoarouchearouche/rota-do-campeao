"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

const COUNTER_URL = "https://abacus.jasoncameron.dev/hit/rotadocampeao-com-br/acessos";

/**
 * A simple public hit counter, not a unique-visitor count — every full page load increments
 * it (client-side navigations inside the app don't remount the footer, so this fires once per
 * visit in practice). Backed by a free, no-signup counting service since the project has no
 * database of its own; if that service is unreachable, this renders nothing rather than a
 * fake/stale number.
 */
export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(COUNTER_URL)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.value === "number") {
          setCount(data.value);
        }
      })
      .catch(() => {
        // serviço de contagem indisponível — sem fallback inventado, só não mostra nada
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-2">
      <Eye size={12} aria-hidden="true" />
      {count.toLocaleString("pt-BR")} acessos
    </span>
  );
}
