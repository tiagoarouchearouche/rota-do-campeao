"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function RefreshDataButton({ onRefresh }: { onRefresh: () => Promise<void> | void }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleClick() {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRefreshing}
      className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-white transition hover:bg-surface-hover disabled:opacity-60"
    >
      <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} aria-hidden="true" />
      {isRefreshing ? "Atualizando..." : "Atualizar"}
    </button>
  );
}
