/**
 * Resolve a team name (from the mock provider or from football-data.org, which passes
 * `team.name` through verbatim with zero normalization) into one of the 20 static crest
 * files under public/logos-brasileirao/. The Série A roster rotates every season (4 teams
 * up/down), so this table will NOT always have every current team — callers must treat a
 * `null` return as expected, not a bug, and fall back to a neutral placeholder.
 */
const LOGO_BASE_PATH = "/logos-brasileirao";

const TEAM_ALIASES: Record<string, string> = {
  "athletico paranaense": "athletico-paranaense",
  "athletico pr": "athletico-paranaense",
  "athletico-pr": "athletico-paranaense",
  "atletico paranaense": "athletico-paranaense",
  "ca paranaense": "athletico-paranaense",
  "club athletico paranaense": "athletico-paranaense",

  "atletico mineiro": "atletico-mineiro",
  "atletico-mg": "atletico-mineiro",
  "atletico mg": "atletico-mineiro",
  "ca mineiro": "atletico-mineiro",
  "clube atletico mineiro": "atletico-mineiro",

  bahia: "bahia",
  "ec bahia": "bahia",
  "esporte clube bahia": "bahia",

  botafogo: "botafogo",
  "botafogo fr": "botafogo",
  "botafogo de futebol e regatas": "botafogo",

  chapecoense: "chapecoense",
  "chapecoense af": "chapecoense",
  "associacao chapecoense de futebol": "chapecoense",

  corinthians: "corinthians",
  "sc corinthians paulista": "corinthians",
  "sport club corinthians paulista": "corinthians",

  coritiba: "coritiba",
  "coritiba fbc": "coritiba",
  "coritiba foot ball club": "coritiba",

  cruzeiro: "cruzeiro",
  "cruzeiro ec": "cruzeiro",
  "cruzeiro esporte clube": "cruzeiro",

  flamengo: "flamengo",
  "cr flamengo": "flamengo",
  "clube de regatas do flamengo": "flamengo",

  fluminense: "fluminense",
  "fluminense fc": "fluminense",
  "fluminense football club": "fluminense",

  gremio: "gremio",
  "gremio fbpa": "gremio",
  "gremio foot ball porto alegrense": "gremio",

  internacional: "internacional",
  "sc internacional": "internacional",
  "sport club internacional": "internacional",

  "mirassol sp": "mirassol",
  "mirassol-sp": "mirassol",
  mirassol: "mirassol",
  "mirassol fc": "mirassol",
  "mirassol futebol clube": "mirassol",

  palmeiras: "palmeiras",
  "se palmeiras": "palmeiras",
  "sociedade esportiva palmeiras": "palmeiras",

  bragantino: "bragantino",
  "rb bragantino": "bragantino",
  "red bull bragantino": "bragantino",
  "clube atletico bragantino": "bragantino",

  remo: "remo",
  "clube do remo": "remo",

  santos: "santos",
  "santos fc": "santos",

  "sao paulo": "sao-paulo",
  "sao paulo fc": "sao-paulo",
  "sao paulo futebol clube": "sao-paulo",

  "vasco da gama": "vasco-da-gama",
  vasco: "vasco-da-gama",
  "cr vasco da gama": "vasco-da-gama",
  "club de regatas vasco da gama": "vasco-da-gama",

  vitoria: "vitoria",
  "ec vitoria": "vitoria",
  "esporte clube vitoria": "vitoria",
};

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[-\s]+/g, " ")
    .trim();
}

/**
 * The canonical short slug for one of the 20 known clubs (e.g. "atletico-mineiro"), shared
 * between crest resolution here and URL slugs in teamSlug.ts — both are really the same
 * "which known club is this" problem. Returns null for a team outside the alias table (a
 * promoted club this season, for example); callers decide their own fallback.
 */
export function resolveTeamSlug(teamName: string): string | null {
  const normalized = normalize(teamName);
  return TEAM_ALIASES[normalized] ?? null;
}

/** Returns the public path to the team's crest, or null when no local asset matches. */
export function resolveTeamLogo(teamName: string): string | null {
  const slug = resolveTeamSlug(teamName);
  if (!slug) return null;
  return `${LOGO_BASE_PATH}/${slug}.png`;
}

export function getTeamInitials(teamName: string): string {
  const words = teamName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
