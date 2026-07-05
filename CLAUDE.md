# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js version warning

@AGENTS.md

Concretely: before writing or editing App Router pages / route handlers, check `node_modules/next/dist/docs/` for this installed version's actual behavior instead of assuming prior knowledge.

## Commands

```bash
npm run dev      # dev server (Turbopack) at http://localhost:3000
npm run build    # production build — must pass with zero TypeScript errors
npm run lint     # eslint (eslint-config-next + custom rule override, see eslint.config.mjs)
npm run test     # vitest run — all *.test.ts under src/**
npx vitest run path/to/file.test.ts   # run a single test file
npx tsc --noEmit # type-check only, no build output
```

There is no test watch script configured; use `npx vitest` (without `run`) for watch mode.

## Architecture

**Rota do Campeão** — pick a competition and team, see the path to the title / next-stage qualification / relegation escape, under optimistic/realistic/pessimistic scenarios, shareable by link/WhatsApp/image.

### Data flow (the core design constraint)

External sports API keys must never reach the browser. Every screen goes through this chain:

```
Client components (fetch("/api/...")) 
  → src/app/api/*/route.ts (Next.js route handlers, server-only)
  → sportsDataService.ts (decides: cache hit? → provider mode? → competition mapped? → key present?)
  → providers/{apiFootballProvider,footballDataProvider,mockProvider}.ts
  → normalizers/*.ts (external JSON → internal types, providers only)
  → cache/memoryCache.ts (in-memory TTL cache, keyed by namespace+competitionId+season)
  → back to the route handler as a ServiceEnvelope<T> { data, source, isMock, updatedAt, warning?, cached? }
```

`sportsDataService.ts` is the only place that orchestrates fallback logic. It never throws to the caller — any failure mode (missing key, invalid key, rate limit, provider down, unmapped competition, invalid/incomplete data, network error, timeout, bad JSON) resolves to a **mock** response with `isMock: true` and a Portuguese `warning` string. This means the app is fully functional with zero env vars configured. Every fetch attempt also logs a one-line `[sportsData] ...` diagnostic to the server console (provider tried, whether each key was *present*, cache hit, fallback reason) — never the key values themselves.

Provider selection is controlled by `SPORTS_DATA_PROVIDER` (`mock` | `api-football` | `football-data` | `auto`, defaults to `mock` if unset/invalid). `auto` tries API-Football then football-data.org then mock.

Home page (`src/app/page.tsx`) is a Server Component that calls `getCompetitions()` directly (no HTTP round-trip needed since it already runs server-side). Competition and team pages are Client Components that fetch the internal `/api/*` routes because they need client-side interactivity (refresh button, tabs, scenario switch, URL/localStorage sync).

`/api/standings` and `/api/team-path` run their standings through `calculations/standingsEnrichment.ts` before responding, filling in `form`/`nextMatch`/`percentage` on each `TeamStanding` from whatever fixtures were already fetched — it only fills gaps a provider didn't supply (e.g. API-Football's native `form` field wins over the derived one). This enrichment step lives in the route handler, not in `sportsDataService`, which stays a pure data-fetching layer.

### httpClient status-code quirks (don't "simplify" this away)

`providers/httpClient.ts` maps HTTP 400 to `invalid_key`, not just 401/403 — football-data.org actually returns **400** (with an `"Your API token is invalid"` body) for a bad/expired token instead of a 401/403. Without this, an invalid football-data key silently falls back to mock tagged as a generic "provider down" instead of the actionable "invalid key" warning.

### Competition registry: two different `season` conventions

`src/services/sportsData/competitions/competitionRegistry.ts` is the single list of supported competitions and their per-provider IDs (`providerLeagueId` for API-Football, `providerCompetitionCode` for football-data.org). A competition with `status: "needs_mapping"` (unconfirmed ID) is *never* sent to a real provider — `sportsDataService` forces mock for it regardless of `SPORTS_DATA_PROVIDER`. Don't invent IDs when adding competitions; leave them `needs_mapping` until confirmed (the dev-only `/api/leagues-search?q=` route wraps API-Football's `/leagues?search=` to help confirm a `providerLeagueId` before flipping a competition to `available`).

Critically, **`season` is not just "the current year"**: split-calendar European leagues + Champions League (`EUROPEAN_SPLIT_SEASON`) are labeled by the year the season *started* (2025-26 is `season=2025`), while calendar-year competitions — Brasileirão, Libertadores, Copa do Mundo (`CALENDAR_YEAR_SEASON`) — use the season's own year. Getting this wrong doesn't error — the provider just returns next season's fixtures with everyone at 0 played/0 points, which looks like a bug but isn't. Revisit these constants every European season turnover (~August).

Provider coverage also differs per competition: football-data.org's free tier has no South American club competitions (Libertadores always falls back to mock there even with a valid key) — that's a provider limitation, not a bug to "fix" in the fallback logic.

### Mock data is a deterministic season simulator, not static fixtures

`providers/mockProvider.ts` generates a full round-robin season (single or double, per competition) using a seeded PRNG (`mulberry32`), then derives standings by aggregating the simulated finished fixtures — so `points`/`goalDifference`/`played` are always internally consistent with the fixture list, and results are stable across requests/builds (same seed → same output). When adding a new mocked competition, add its team-name list and `{ playedRounds, doubleRoundRobin }` config to the maps in that file; competitions without a curated list fall back to generic "Time Demonstração N" names using the same engine.

### Calculation engines are pure functions over (team, standings, fixtures, competition)

`calculations/pathEngine.ts` and `calculations/scenarioEngine.ts` take no external state — they're called from the `/api/team-path` route handler after standings+fixtures are fetched. `identifyDirectConfrontations` (pathEngine) picks "decisive matches" as remaining fixtures against opponents within ±4 table positions — this single rule covers both title-race rivals (near the top) and relegation rivals (near the bottom). Risk levels (`low`/`medium`/`high`/`critical`) are derived from `pointsNeeded / (remainingGames * 3)`, not hardcoded per competition.

`calculatePointsNeededToAvoidRelegation` returns `null` when `competition.hasRelegation` is false — callers (the team-path route, the UI) must handle the null case by omitting the relegation block entirely rather than rendering an empty one.

### Demo-data visibility is environment-gated, not always-on

`ApiWarningBanner` (`src/components/ApiWarningBanner.tsx`) only renders when `isMock && process.env.NODE_ENV === "development"` — in production, mock data is signaled *only* by the small `DataSourceBadge` pill ("Fonte: Demonstração"), deliberately with no large warning banner. The collapsible `DataStatusPanel` (provider used, cache hit, fallback, mapped status) is the "show me the technical detail" escape hatch and is always available, collapsed by default, in both environments. Don't reintroduce an always-visible mock warning — that was an explicit product decision.

### Shareable state

`src/lib/shareState.ts` encodes scenario + season + timestamp as base64 into a `state` query param; `src/lib/userPreferences.ts` wraps `localStorage` (last competition, last team, scenario preference) with try/catch no-ops so it degrades silently when storage is unavailable. Never store API keys in localStorage — only user-facing preferences. `components/ShareButtons.tsx` also renders a branded PNG summary card client-side via `<canvas>` (no image/screenshot library).

### Full provider/cache/fallback reference

`docs/api-integrations.md` has the complete breakdown of provider endpoints, error-reason-to-warning-message mapping, cache TTL behavior, the `season` convention split, provider coverage gaps, and how to map a new competition. Read it before modifying `sportsDataService.ts` or the providers.
