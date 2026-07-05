/**
 * Mock data is signaled to real visitors ONLY by the small "Fonte: Demonstração" pill
 * (DataSourceBadge) — never a large banner. This discreet technical note is gated by the same
 * SHOW_TECHNICAL_DATA_STATUS flag as DataStatusPanel, so it's opt-in (default off) rather than
 * tied to NODE_ENV, and never occupies the top of the screen with an error-looking banner.
 */
export function ApiWarningBanner({ isMock, showTechnicalStatus }: { isMock: boolean; showTechnicalStatus?: boolean }) {
  if (!isMock || !showTechnicalStatus) return null;

  return (
    <div className="flex items-start gap-2 rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
      <span aria-hidden>🛠️</span>
      <p>Modo demonstração ativo. Configure FOOTBALL_DATA_KEY para dados reais.</p>
    </div>
  );
}
