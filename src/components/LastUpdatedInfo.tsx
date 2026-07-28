export function LastUpdatedInfo({ updatedAt }: { updatedAt: string }) {
  const date = new Date(updatedAt);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return <span className="text-xs text-muted">Última atualização: {formatted}</span>;
}
