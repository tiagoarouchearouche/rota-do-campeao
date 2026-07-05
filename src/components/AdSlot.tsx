type AdSlotType = "leaderboard" | "sidebar" | "in-content" | "mobile" | "footer";

const DIMENSIONS: Record<AdSlotType, string> = {
  leaderboard: "min-h-[90px] max-w-[970px]",
  sidebar: "min-h-[250px] max-w-[300px]",
  "in-content": "min-h-[100px]",
  mobile: "min-h-[100px] max-w-[320px] sm:hidden",
  footer: "min-h-[90px]",
};

export function AdSlot({ type, label = "Espaço para anúncio" }: { type: AdSlotType; label?: string }) {
  return (
    <div
      role="complementary"
      aria-label="Publicidade"
      className={`mx-auto flex w-full items-center justify-center rounded-md border border-dashed border-neutral-300 bg-neutral-100/60 text-xs text-neutral-400 dark:border-neutral-700 dark:bg-neutral-900/40 dark:text-neutral-600 ${DIMENSIONS[type]}`}
    >
      {label}
    </div>
  );
}
