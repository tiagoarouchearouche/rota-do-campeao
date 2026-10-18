import Image from "next/image";
import { getTeamInitials, resolveTeamLogo } from "@/lib/teamLogos";

type Size = "sm" | "md" | "lg" | number;

const SIZE_MAP: Record<"sm" | "md" | "lg", number> = {
  sm: 20,
  md: 32,
  lg: 64,
};

function resolvePixelSize(size: Size): number {
  return typeof size === "number" ? size : SIZE_MAP[size];
}

export function TeamLogo({ team, size = "md", className }: { team: string; size?: Size; className?: string }) {
  const px = resolvePixelSize(size);
  const logoSrc = resolveTeamLogo(team);

  if (!logoSrc) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface text-muted-2 ${className ?? ""}`}
        style={{ width: px, height: px, fontSize: Math.max(8, px * 0.32) }}
        aria-hidden="true"
      >
        {getTeamInitials(team)}
      </span>
    );
  }

  return (
    <Image
      src={logoSrc}
      alt={`Escudo do ${team}`}
      width={px}
      height={px}
      className={`shrink-0 object-contain ${className ?? ""}`}
      style={{ width: px, height: px }}
    />
  );
}
