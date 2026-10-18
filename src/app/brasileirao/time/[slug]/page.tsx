import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStandings } from "@/services/sportsData/sportsDataService";
import { getTeamPathData } from "@/services/sportsData/teamPath";
import { BRASILEIRAO_COMPETITION_ID } from "@/services/sportsData/competitions/competitionRegistry";
import { findTeamBySlug, getTeamUrl } from "@/lib/teamSlug";
import { TeamPathClient } from "./TeamPathClient";

type Params = { slug: string };

async function resolveTeam(slug: string) {
  const { data: standings } = await getStandings(BRASILEIRAO_COMPETITION_ID);
  return findTeamBySlug(standings, slug) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const team = await resolveTeam(slug);
  if (!team) return { title: "Time não encontrado" };

  const title = `${team.teamName} no Brasileirão Série A — classificação, jogos e rota`;
  const description = `Veja posição, pontos, próximos jogos e o que o ${team.teamName} precisa no Brasileirão Série A.`;
  const url = getTeamUrl(team.teamName);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TeamPathPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const team = await resolveTeam(slug);
  if (!team) notFound();

  const result = await getTeamPathData(BRASILEIRAO_COMPETITION_ID, team.teamId);

  return <TeamPathClient teamId={team.teamId} slug={slug} initialResult={result} />;
}
