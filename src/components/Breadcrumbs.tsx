import Link from "next/link";
import { ChevronRight } from "lucide-react";

export type BreadcrumbItem = { name: string; path?: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="flex items-center gap-1.5 text-xs text-muted-2">
      {items.map((item, index) => (
        <span key={item.name} className="flex items-center gap-1.5">
          {index > 0 && <ChevronRight size={12} aria-hidden="true" />}
          {item.path ? (
            <Link href={item.path} className="hover:text-white">
              {item.name}
            </Link>
          ) : (
            <span aria-current="page" className="text-white">
              {item.name}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
