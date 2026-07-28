import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCompetitionById } from "@/services/sportsData/competitions/competitionRegistry";
import { getStandings } from "@/services/sportsData/sportsDataService";
import { TeamPathClient } from "./TeamPathClient";

type Params = { competitionId: string; teamId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { competitionId, teamId } = await params;
  const competition = getCompetitionById(competitionId);
  if (!competition) return { title: "Competição não encontrada" };

  const standingsEnvelope = await getStandings(competitionId);
  const team = standingsEnvelope.data.find((s) => s.teamId === teamId);
  if (!team) return { title: "Time não encontrado" };

  const title = `Caminho do ${team.teamName} até o título`;
  const description = `Veja a posição, os pontos e os cenários de título, classificação e rebaixamento do ${team.teamName} no ${competition.name}.`;
  const url = `/competicao/${competitionId}/time/${teamId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { title, description },
  };
}

export default async function TeamPathPage({ params }: { params: Promise<Params> }) {
  const { competitionId, teamId } = await params;
  if (!getCompetitionById(competitionId)) notFound();

  return <TeamPathClient competitionId={competitionId} teamId={teamId} />;
}
