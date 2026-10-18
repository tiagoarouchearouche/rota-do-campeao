"use client";

import { useState } from "react";
import Link from "next/link";
import { getCookieConsent, setCookieConsent } from "@/lib/userPreferences";

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => getCookieConsent() === null);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [advertising, setAdvertising] = useState(false);

  if (!visible) return null;

  function acceptAll() {
    setCookieConsent({ necessary: true, analytics: true, advertising: true });
    setVisible(false);
  }

  function acceptNecessaryOnly() {
    setCookieConsent({ necessary: true, analytics: false, advertising: false });
    setVisible(false);
  }

  function savePreferences() {
    setCookieConsent({ necessary: true, analytics, advertising });
    setVisible(false);
  }

  return (
    <div role="region" aria-label="Preferências de cookies" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-graphite p-4">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3">
        <p className="text-sm text-muted">
          Usamos cookies necessários ao funcionamento do site e, com sua permissão, cookies de análise e
          publicidade. Veja a{" "}
          <Link href="/cookies" className="text-lime hover:underline">
            Política de Cookies
          </Link>
          .
        </p>

        {expanded && (
          <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3 text-sm">
            <label className="flex items-center justify-between gap-2">
              <span className="text-muted-2">Necessários (sempre ativos)</span>
              <input type="checkbox" checked disabled className="accent-lime" />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-white">Análise</span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="accent-lime"
              />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span className="text-white">Publicidade</span>
              <input
                type="checkbox"
                checked={advertising}
                onChange={(event) => setAdvertising(event.target.checked)}
                className="accent-lime"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={acceptAll} className="rounded-md bg-lime px-4 py-2 text-xs font-bold text-ink">
            Aceitar todos
          </button>
          <button
            type="button"
            onClick={acceptNecessaryOnly}
            className="rounded-md border border-border px-4 py-2 text-xs font-medium text-white hover:bg-surface"
          >
            Somente necessários
          </button>
          {expanded ? (
            <button
              type="button"
              onClick={savePreferences}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium text-white hover:bg-surface"
            >
              Salvar preferências
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="rounded-md border border-border px-4 py-2 text-xs font-medium text-white hover:bg-surface"
            >
              Preferências
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
