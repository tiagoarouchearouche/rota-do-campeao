import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompetitionById } from "@/services/sportsData/competitions/competitionRegistry";
import { CompetitionPageClient } from "./CompetitionPageClient";

type Params = { competitionId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { competitionId } = await params;
  const competition = getCompetitionById(competitionId);
  if (!competition) return { title: "Competição não encontrada" };

  const title = `Tabela do ${competition.name}`;
  const description = `Consulte a tabela, os jogos restantes e simule cenários de título, classificação e rebaixamento do ${competition.name}.`;
  const url = `/competicao/${competitionId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { title, description },
  };
}

export default async function CompetitionPage({ params }: { params: Promise<Params> }) {
  const { competitionId } = await params;
  if (!getCompetitionById(competitionId)) notFound();

  return <CompetitionPageClient competitionId={competitionId} />;
}
