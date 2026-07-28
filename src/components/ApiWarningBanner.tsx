import { AlertTriangle } from "lucide-react";

/**
 * Always visible whenever the data on screen is mocked — this is a trust requirement, not a
 * developer setting: demonstrative data must never be presented as if it were official. Kept
 * separate from DataStatusPanel (the opt-in technical debug view).
 */
export function ApiWarningBanner({ isMock }: { isMock: boolean }) {
  if (!isMock) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
    >
      <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>Estes são dados demonstrativos e não representam a classificação oficial atual.</p>
    </div>
  );
}
