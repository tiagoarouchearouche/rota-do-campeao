"use client";

import { useState } from "react";

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
      className="inline-flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      <span className={isRefreshing ? "animate-spin" : ""}>⟳</span>
      {isRefreshing ? "Atualizando..." : "Atualizar dados"}
    </button>
  );
}
