import type {
  Competition,
  Fixture,
  MatchStatus,
  ProviderFetchResult,
  SportsDataProviderClient,
  Team,
  TeamStanding,
  TeamStatus,
} from "../types";
import { competitions } from "../competitions/competitionRegistry";

/** Deterministic PRNG (mulberry32) so mock seasons are stable across requests/builds. */
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type RoundPair = [string, string];

function buildRoundRobinRounds(teamIds: string[], double: boolean): RoundPair[][] {
  const teams = [...teamIds];
  if (teams.length % 2 !== 0) teams.push("__BYE__");
  const n = teams.length;
  const singleRounds: RoundPair[][] = [];
  const arr = teams.slice();

  for (let r = 0; r < n - 1; r++) {
    const roundPairs: RoundPair[] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = arr[i];
      const away = arr[n - 1 - i];
      if (home !== "__BYE__" && away !== "__BYE__") {
        roundPairs.push(r % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    singleRounds.push(roundPairs);
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop() as string);
    arr.splice(0, arr.length, fixed, ...rest);
  }

  if (!double) return singleRounds;
  const reversedRounds = singleRounds.map((round) =>
    round.map(([home, away]) => [away, home] as RoundPair)
  );
  return [...singleRounds, ...reversedRounds];
}

function deriveStatus(position: number, totalTeams: number, competition: Competition): TeamStatus {
  const titleWindow = Math.max(competition.titleSpots ?? 1, 4);
  if (position <= titleWindow) return "title_race";
  if (competition.qualificationSpots && position <= competition.qualificationSpots) {
    return "qualification_zone";
  }
  if (competition.hasRelegation && competition.relegationSpots) {
    const relegationLine = totalTeams - competition.relegationSpots;
    if (position > relegationLine) return "relegation_zone";
    if (position > relegationLine - 3) return "relegation_risk";
  }
  return "mid_table";
}

type SimulatedSeason = {
  standings: TeamStanding[];
  fixtures: Fixture[];
  teams: Team[];
};

function simulateSeason(
  competition: Competition,
  teamNames: string[],
  playedRounds: number,
  doubleRoundRobin: boolean
): SimulatedSeason {
  const teamIds = teamNames.map(slugify);
  const strengthByTeamId = new Map(teamIds.map((id, index) => [id, teamNames.length - index]));
  const nameByTeamId = new Map(teamIds.map((id, index) => [id, teamNames[index]]));
  const rounds = buildRoundRobinRounds(teamIds, doubleRoundRobin);
  const rng = mulberry32(seedFromString(competition.id));

  const startDate = new Date("2026-02-01T00:00:00.000Z");
  const fixtures: Fixture[] = [];

  const totals = new Map<
    string,
    { played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number }
  >();
  for (const id of teamIds) {
    totals.set(id, { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 });
  }

  rounds.forEach((round, roundIndex) => {
    const roundDate = new Date(startDate.getTime() + roundIndex * 7 * 24 * 60 * 60 * 1000);
    const isFinished = roundIndex < playedRounds;

    round.forEach(([homeId, awayId]) => {
      const status: MatchStatus = isFinished ? "finished" : "scheduled";
      let homeGoals: number | undefined;
      let awayGoals: number | undefined;

      if (isFinished) {
        const homeStrength = strengthByTeamId.get(homeId) ?? 1;
        const awayStrength = strengthByTeamId.get(awayId) ?? 1;
        const expectedHome = 1.4 + (homeStrength - awayStrength) * 0.06 + 0.3;
        const expectedAway = 1.1 + (awayStrength - homeStrength) * 0.06;
        homeGoals = Math.max(0, Math.round(expectedHome + (rng() - 0.5) * 2.4));
        awayGoals = Math.max(0, Math.round(expectedAway + (rng() - 0.5) * 2.4));

        const homeTotals = totals.get(homeId)!;
        const awayTotals = totals.get(awayId)!;
        homeTotals.played += 1;
        awayTotals.played += 1;
        homeTotals.goalsFor += homeGoals;
        homeTotals.goalsAgainst += awayGoals;
        awayTotals.goalsFor += awayGoals;
        awayTotals.goalsAgainst += homeGoals;

        if (homeGoals > awayGoals) {
          homeTotals.wins += 1;
          awayTotals.losses += 1;
        } else if (homeGoals < awayGoals) {
          awayTotals.wins += 1;
          homeTotals.losses += 1;
        } else {
          homeTotals.draws += 1;
          awayTotals.draws += 1;
        }
      }

      fixtures.push({
        fixtureId: `${competition.id}-r${roundIndex + 1}-${homeId}-${awayId}`,
        date: roundDate.toISOString(),
        homeTeamId: homeId,
        homeTeamName: nameByTeamId.get(homeId) ?? homeId,
        awayTeamId: awayId,
        awayTeamName: nameByTeamId.get(awayId) ?? awayId,
        homeGoals,
        awayGoals,
        status,
        round: `Rodada ${roundIndex + 1}`,
      });
    });
  });

  const unsorted: Omit<TeamStanding, "position" | "status">[] = teamIds.map((id) => {
    const t = totals.get(id)!;
    return {
      teamId: id,
      teamName: nameByTeamId.get(id) ?? id,
      played: t.played,
      wins: t.wins,
      draws: t.draws,
      losses: t.losses,
      goalsFor: t.goalsFor,
      goalsAgainst: t.goalsAgainst,
      goalDifference: t.goalsFor - t.goalsAgainst,
      points: t.wins * 3 + t.draws,
    };
  });

  unsorted.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  const standings: TeamStanding[] = unsorted.map((entry, index) => {
    const position = index + 1;
    return {
      ...entry,
      position,
      status: deriveStatus(position, teamIds.length, competition),
    };
  });

  const teams: Team[] = teamIds.map((id) => ({
    teamId: id,
    teamName: nameByTeamId.get(id) ?? id,
  }));

  return { standings, fixtures, teams };
}

const MOCK_TEAM_NAMES: Record<string, string[]> = {
  "brasileirao-serie-a": [
    "Flamengo",
    "Palmeiras",
    "Botafogo",
    "Fortaleza",
    "Atlético-MG",
    "Internacional",
    "São Paulo",
    "Corinthians",
    "Bahia",
    "Cruzeiro",
    "Grêmio",
    "Vasco da Gama",
    "Fluminense",
    "Athletico-PR",
    "Criciúma",
    "Juventude",
    "Bragantino",
    "Cuiabá",
    "Atlético-GO",
    "Vitória",
  ],
  "brasileirao-serie-b": [
    "Santos",
    "Sport",
    "Ceará",
    "Coritiba",
    "Avaí",
    "Chapecoense",
    "Guarani",
    "Ponte Preta",
    "Novorizontino",
    "Vila Nova",
    "CRB",
    "Botafogo-SP",
    "Amazonas",
    "Operário-PR",
    "Paysandu",
    "Goiás",
    "América-MG",
    "Ituano",
    "Mirassol",
    "Brusque",
  ],
  "premier-league": [
    "Manchester City",
    "Arsenal",
    "Liverpool",
    "Aston Villa",
    "Tottenham Hotspur",
    "Chelsea",
    "Newcastle United",
    "Manchester United",
    "West Ham United",
    "Crystal Palace",
    "Brighton",
    "Bournemouth",
    "Fulham",
    "Wolverhampton",
    "Everton",
    "Brentford",
    "Nottingham Forest",
    "Luton Town",
    "Burnley",
    "Sheffield United",
  ],
  "championship-inglaterra": [
    "Leeds United",
    "Burnley",
    "Sheffield United",
    "West Bromwich Albion",
    "Norwich City",
    "Middlesbrough",
    "Coventry City",
    "Preston North End",
    "Bristol City",
    "Swansea City",
    "Hull City",
    "Millwall",
    "Watford",
    "Blackburn Rovers",
    "Stoke City",
    "Cardiff City",
    "Sunderland",
    "Queens Park Rangers",
    "Plymouth Argyle",
    "Rotherham United",
    "Birmingham City",
    "Huddersfield Town",
    "Southampton",
    "Ipswich Town",
  ],
  "primeira-liga-portugal": [
    "Benfica",
    "Porto",
    "Sporting CP",
    "Braga",
    "Vitória de Guimarães",
    "Famalicão",
    "Rio Ave",
    "Casa Pia",
    "Estoril",
    "Arouca",
    "Gil Vicente",
    "Moreirense",
    "Boavista",
    "Farense",
    "Portimonense",
    "Estrela da Amadora",
    "Nacional",
    "AVS",
  ],
  eredivisie: [
    "Ajax",
    "PSV Eindhoven",
    "Feyenoord",
    "AZ Alkmaar",
    "FC Twente",
    "FC Utrecht",
    "Sparta Rotterdam",
    "NEC Nijmegen",
    "Go Ahead Eagles",
    "Fortuna Sittard",
    "Heerenveen",
    "PEC Zwolle",
    "Willem II",
    "NAC Breda",
    "Heracles Almelo",
    "RKC Waalwijk",
    "Groningen",
    "Volendam",
  ],
  eurocopa: [
    "Alemanha",
    "Espanha",
    "França",
    "Inglaterra",
    "Portugal",
    "Itália",
    "Holanda",
    "Bélgica",
    "Croácia",
    "Dinamarca",
    "Suíça",
    "Áustria",
    "Turquia",
    "Polônia",
    "República Tcheca",
    "Eslováquia",
    "Eslovênia",
    "Sérvia",
    "Escócia",
    "Romênia",
    "Ucrânia",
    "Albânia",
    "Hungria",
    "Geórgia",
  ],
  "champions-league": [
    "Real Madrid",
    "Manchester City",
    "Bayern de Munique",
    "Paris Saint-Germain",
    "Barcelona",
    "Liverpool",
    "Inter de Milão",
    "Arsenal",
    "Borussia Dortmund",
    "Atlético de Madrid",
    "Juventus",
    "Benfica",
    "Porto",
    "RB Leipzig",
    "PSV Eindhoven",
    "Napoli",
    "Shakhtar Donetsk",
    "Celtic",
  ],
  libertadores: [
    "Flamengo",
    "Palmeiras",
    "River Plate",
    "Boca Juniors",
    "Botafogo",
    "Fluminense",
    "Atlético-MG",
    "São Paulo",
    "Racing Club",
    "Independiente del Valle",
    "Peñarol",
    "Nacional",
    "Colo-Colo",
    "Universitario",
    "Cerro Porteño",
    "Olimpia",
  ],
  // 48 seleções, refletindo o formato da Copa de 2026 (12 grupos de 4). Lista meramente
  // demonstrativa — não representa o chaveamento oficial nem resultados reais do torneio.
  "copa-do-mundo": [
    "Brasil",
    "Argentina",
    "França",
    "Inglaterra",
    "Espanha",
    "Portugal",
    "Alemanha",
    "Holanda",
    "Bélgica",
    "Itália",
    "Uruguai",
    "Croácia",
    "Marrocos",
    "Estados Unidos",
    "México",
    "Japão",
    "Coreia do Sul",
    "Senegal",
    "Suíça",
    "Dinamarca",
    "Colômbia",
    "Equador",
    "Canadá",
    "Austrália",
    "Gana",
    "Camarões",
    "Sérvia",
    "Polônia",
    "Áustria",
    "Irã",
    "Arábia Saudita",
    "Catar",
    "País de Gales",
    "Escócia",
    "Turquia",
    "Ucrânia",
    "Egito",
    "Nigéria",
    "Argélia",
    "Tunísia",
    "África do Sul",
    "Costa do Marfim",
    "Panamá",
    "Jamaica",
    "Costa Rica",
    "Honduras",
    "Nova Zelândia",
    "China",
  ],
};

/** rounds already played + whether the season format is a double round-robin (league) or single (groups). */
const MOCK_SEASON_CONFIG: Record<string, { playedRounds: number; doubleRoundRobin: boolean }> = {
  "brasileirao-serie-a": { playedRounds: 25, doubleRoundRobin: true },
  "brasileirao-serie-b": { playedRounds: 25, doubleRoundRobin: true },
  "premier-league": { playedRounds: 28, doubleRoundRobin: true },
  "championship-inglaterra": { playedRounds: 34, doubleRoundRobin: true },
  "la-liga": { playedRounds: 28, doubleRoundRobin: true },
  "serie-a-italia": { playedRounds: 28, doubleRoundRobin: true },
  bundesliga: { playedRounds: 25, doubleRoundRobin: true },
  "ligue-1": { playedRounds: 25, doubleRoundRobin: true },
  "primeira-liga-portugal": { playedRounds: 25, doubleRoundRobin: true },
  eredivisie: { playedRounds: 25, doubleRoundRobin: true },
  "champions-league": { playedRounds: 6, doubleRoundRobin: false },
  eurocopa: { playedRounds: 4, doubleRoundRobin: false },
  libertadores: { playedRounds: 6, doubleRoundRobin: false },
  "copa-do-mundo": { playedRounds: 32, doubleRoundRobin: false },
};

const GENERIC_TEAM_NAMES = Array.from({ length: 16 }, (_, i) => `Time Demonstração ${i + 1}`);

const seasonCache = new Map<string, SimulatedSeason>();

function getSeasonFor(competition: Competition): SimulatedSeason {
  const cacheKey = `${competition.id}-${competition.season}`;
  const cached = seasonCache.get(cacheKey);
  if (cached) return cached;

  const teamNames = MOCK_TEAM_NAMES[competition.id] ?? GENERIC_TEAM_NAMES;
  const config = MOCK_SEASON_CONFIG[competition.id] ?? { playedRounds: 5, doubleRoundRobin: false };
  const season = simulateSeason(competition, teamNames, config.playedRounds, config.doubleRoundRobin);
  seasonCache.set(cacheKey, season);
  return season;
}

export const MOCK_WARNING =
  "Usando dados demonstrativos porque a API não está configurada ou indisponível.";

export const mockProvider: SportsDataProviderClient = {
  id: "mock",

  async fetchCompetitions(): Promise<ProviderFetchResult<Competition[]>> {
    return { ok: true, data: competitions };
  },

  async fetchStandings(competition: Competition): Promise<ProviderFetchResult<TeamStanding[]>> {
    const season = getSeasonFor(competition);
    return { ok: true, data: season.standings };
  },

  async fetchFixtures(competition: Competition): Promise<ProviderFetchResult<Fixture[]>> {
    const season = getSeasonFor(competition);
    return { ok: true, data: season.fixtures };
  },

  async fetchTeams(competition: Competition): Promise<ProviderFetchResult<Team[]>> {
    const season = getSeasonFor(competition);
    return { ok: true, data: season.teams };
  },
};
