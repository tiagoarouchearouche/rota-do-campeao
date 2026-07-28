export type AdPlacement = "hero-banner" | "content-banner" | "sidebar" | "post-simulation" | "footer";
export type AdFormat = "horizontal" | "vertical" | "square";

const DEFAULT_MIN_HEIGHT: Record<AdFormat, number> = {
  horizontal: 90,
  vertical: 250,
  square: 250,
};

/**
 * Reserved space for a future ad network (e.g. Google AdSense) — never wired to a real
 * network or fake slot ID here. In development it shows a discreet placeholder so layout
 * can be verified; in production, since nothing actually fills it yet, it collapses to a
 * thin reserved strip instead of leaving a big empty box on the page.
 */
export function AdSlot({
  placement,
  format = "horizontal",
  className = "",
  minHeight,
}: {
  placement: AdPlacement;
  format?: AdFormat;
  className?: string;
  minHeight?: number;
}) {
  const height = minHeight ?? DEFAULT_MIN_HEIGHT[format];
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    return (
      <div
        data-ad-placement={placement}
        data-ad-format={format}
        aria-hidden="true"
        className={className}
        style={{ minHeight: 2 }}
      />
    );
  }

  return (
    <div
      role="complementary"
      aria-label="Publicidade"
      data-ad-placement={placement}
      data-ad-format={format}
      className={`flex w-full items-center justify-center rounded-md border border-dashed border-border bg-graphite/60 text-xs text-muted-2 ${className}`}
      style={{ minHeight: height }}
    >
      Espaço publicitário
    </div>
  );
}
