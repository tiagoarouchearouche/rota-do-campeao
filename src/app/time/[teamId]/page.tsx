import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStandings } from "@/services/sportsData/sportsDataService";
import { getCompetitionById, BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { TeamPathClient } from "./TeamPathClient";

type Params = { teamId: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { teamId } = await params;
  const competition = getCompetitionById(BRASILEIRAO_COMPETITION_ID);
  if (!competition) return { title: "Time não encontrado" };

  const { data: standings } = await getStandings(BRASILEIRAO_COMPETITION_ID);
  const team = standings.find((s) => s.teamId === teamId);
  if (!team) return { title: "Time não encontrado" };

  const title = `${team.teamName} no Brasileirão Série A`;
  const description = `Classificação, jogos restantes e simulação de cenários para o ${team.teamName} no Brasileirão Série A.`;
  const url = `/time/${teamId}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TeamPathPage({ params }: { params: Promise<Params> }) {
  const { teamId } = await params;
  const competition = getCompetitionById(BRASILEIRAO_COMPETITION_ID);
  if (!competition) notFound();

  return <TeamPathClient teamId={teamId} />;
}
