# Integrações de dados esportivos — Rota do Campeão

## 1. Visão geral da arquitetura

```
Front-end (React, client components)
  ↓ fetch("/api/...")
Rotas internas (src/app/api/*/route.ts)
  ↓
sportsDataService.ts
  ↓ decide: cache → football-data.org → mock
providers/{footballDataProvider,mockProvider}.ts
  ↓
normalizers/footballDataNormalizer.ts (só para o provider externo)
  ↓
memoryCache.ts (grava o envelope já normalizado)
  ↓
front-end recebe { data, source, isMock, updatedAt, warning?, cached?, showTechnicalStatus? }
```

**football-data.org é o único provedor de dados reais.** O front-end **nunca** chama a football-data.org diretamente — a chave só existe em `process.env.FOOTBALL_DATA_KEY`, lida exclusivamente no servidor (rotas em `src/app/api`). Todo o código em `src/services/sportsData` roda em contexto de servidor (Route Handlers / Server Components).

> `providers/apiFootballProvider.ts` e `normalizers/apiFootballNormalizer.ts` ainda existem no repositório, mas estão **desconectados** de `sportsDataService.ts` e de qualquer rota — API-Football não é usada nem aparece na interface. Isso é intencional (ver CLAUDE.md); não reconecte-os sem uma decisão explícita.

Estrutura de arquivos:

```
src/services/sportsData/
  types.ts                          tipos internos
  sportsDataService.ts              orquestra cache → football-data.org → fallback mock
  teamSearch.ts                     agrega times de todas as competições disponíveis para a busca cross-competição
  worldCup.ts                       deriva o WorldCupMode e agrupa standings por grupo
  providers/
    httpClient.ts                   fetch com timeout e tradução de erros HTTP
    footballDataProvider.ts         integração com football-data.org + validação de catálogo/plano
    mockProvider.ts                 gera temporadas demonstrativas determinísticas
    apiFootballProvider.ts          isolado, não usado (ver nota acima)
  normalizers/
    footballDataNormalizer.ts
    apiFootballNormalizer.ts        isolado, não usado
  cache/
    memoryCache.ts                  cache em memória com TTL
  calculations/
    pathEngine.ts                   caminho para título / classificação / rebaixamento
    scenarioEngine.ts                cenários otimista / realista / pessimista
    standingsEnrichment.ts          preenche form/nextMatch/percentage a partir de standings+fixtures
  competitions/
    competitionRegistry.ts          catálogo de competições e seus códigos football-data.org
  __tests__/                       testes unitários (vitest)
```

## 2. Como funciona o provedor único (football-data.org)

`footballDataProvider.ts`:
- Header: `X-Auth-Token: process.env.FOOTBALL_DATA_KEY`.
- Endpoints: `/v4/competitions/{code}/standings`, `/matches`, `/teams`.
- Fluxo por chamada: 1) chave configurada? (`missing_key` se não) → 2) `providerCompetitionCode` mapeado? (`not_mapped` se não) → 3) fetch com timeout de 8s (`httpClient.ts`), traduzindo 400/401/403 → `invalid_key` (a football-data.org retorna **400**, não só 401/403, para token inválido/expirado), 429 → `rate_limited`, 5xx → `provider_down` → 4) normaliza a resposta → 5) valida campos obrigatórios (`invalid_data` se incompletos).

## 3. Como configurar variáveis de ambiente

Copie `.env.example` para `.env.local` (na **raiz do projeto**, mesmo nível de `package.json`, nunca dentro de `src/`):

```env
FOOTBALL_DATA_KEY=sua_chave_aqui
SPORTS_DATA_PROVIDER=football-data
SPORTS_DATA_CACHE_TTL_SECONDS=1800
SHOW_TECHNICAL_DATA_STATUS=false
```

- `SPORTS_DATA_PROVIDER` só aceita `football-data` ou `mock` — qualquer outro valor (incluindo o legado `api-football`/`auto`) é tratado como inválido e cai em `mock`. Se ausente, o padrão também é `mock`.
- `SHOW_TECHNICAL_DATA_STATUS` controla a área recolhível "Status dos dados" (`DataStatusPanel`) e o aviso técnico discreto (`ApiWarningBanner`). Por padrão (`false`), nenhum dos dois aparece — a única indicação de fonte para o visitante é o badge pequeno (`DataSourceBadge`).
- Sem `.env.local` (ou sem `FOOTBALL_DATA_KEY`), a aplicação roda 100% em modo demonstração — nada quebra.
- Depois de criar/editar `.env.local`, **reinicie `npm run dev`** — variáveis de ambiente só são lidas na inicialização do processo Node.
- Este é um projeto **Next.js App Router**: as rotas `src/app/api/*/route.ts` já funcionam com `npm run dev` puro. Não é preciso `vercel dev`/`vercel login` para testar localmente.

Onde obter a chave: crie uma conta gratuita em https://www.football-data.org/client/register e copie o token gerado.

## 4. Como funciona o fallback mockado

O `mockProvider` gera temporadas completas e determinísticas (mesmo "seed" sempre produz os mesmos resultados) para: Brasileirão Série A, Premier League, Championship (Inglaterra), La Liga, Serie A Itália, Bundesliga, Ligue 1, Primeira Liga (Portugal), Eredivisie, Champions League, Eurocopa e Copa do Mundo. Para qualquer outra competição, usa nomes genéricos ("Time Demonstração N") mantendo o mesmo motor de simulação.

O fallback é acionado quando:
1. `SPORTS_DATA_PROVIDER=mock` (ou variável ausente) ou `FOOTBALL_DATA_KEY` não configurada;
2. a competição está com `status: "needs_mapping"` no registry (sem código confirmado);
3. a football-data.org retorna 400/401/403 (chave inválida), 429 (limite atingido) ou 5xx (fora do ar);
4. a resposta normalizada não passa na validação de campos obrigatórios;
5. qualquer erro de rede, timeout ou JSON inválido.

Toda resposta mock inclui `isMock: true`. Para o visitante final, isso aparece **apenas** como o badge discreto "Fonte: Demonstração" — nunca um banner grande. O aviso técnico textual e a área "Status dos dados" só aparecem quando `SHOW_TECHNICAL_DATA_STATUS=true`.

### Diagnosticando por que caiu em mock

Cada busca imprime no terminal do servidor uma linha como:

```
[sportsData] competition=premier-league season=2025 mode=football-data provider=mock footballDataKey=true cacheHit=false fellBackToMock=true reason=rate_limited
```

Isso mostra o modo resolvido, o provider tentado, se a chave foi **encontrada** (nunca o valor), se veio do cache, e o motivo do fallback quando houver. Nunca logamos `FOOTBALL_DATA_KEY` em texto.

Causas mais comuns de cair em mock mesmo com chave configurada:
- competição com `status: "needs_mapping"` no registry (`reason=not_mapped`) — código ainda não confirmado;
- competição com código confirmado mas **fora do plano gratuito** (`reason=provider_down` ou `unavailable_plan` já filtrado antes mesmo da tentativa — ver seção 6);
- chave inválida/expirada → 400/401/403 (`reason=invalid_key`);
- **limite de 10 requisições/minuto do plano gratuito atingido** (`reason=rate_limited`) — a busca de time (`/api/search-team`) faz fan-out sobre todas as competições disponíveis e pode consumir a cota rapidamente com o cache frio; depois do primeiro aquecimento (30 min de TTL), buscas subsequentes não geram novas chamadas externas;
- `season` sem dados publicados ainda pelo provedor para aquela competição (`reason=invalid_data`) — ver seção 5.1;
- servidor não reiniciado depois de editar `.env.local`.

## 5. Como funciona o cache

Cache em memória (`cache/memoryCache.ts`), por processo/serverless instance:

- TTL padrão: 1800s (30 min), configurável via `SPORTS_DATA_CACHE_TTL_SECONDS`.
- Chaves segmentadas por namespace (`standings`, `fixtures`, `teams`) + `competitionId` + `season`.
- O catálogo de competições da football-data.org (usado para validar plano/acesso) é cacheado separadamente por 6h — muda raramente.
- Passar `?refresh=true` em qualquer endpoint interno ignora o cache e busca novamente (usado pelo botão "Atualizar dados").

> Observação: em ambientes serverless (Vercel/Netlify) cada invocação fria tem sua própria memória — o cache não é compartilhado entre instâncias.

## 5.1. Cuidado com o valor de `season`

football-data.org nem sempre rotula a temporada pelo ano civil corrente. Ligas de calendário europeu (Premier League, Championship, La Liga, Serie A Itália, Bundesliga, Ligue 1, Primeira Liga, Eredivisie) e a Champions League usam o **ano de início** da temporada — a 2025-26 é `season=2025`, mesmo depois de o calendário virar 2026. Já Brasileirão e Copa do Mundo usam o próprio ano civil. `competitionRegistry.ts` reflete isso com as constantes `CALENDAR_YEAR_SEASON` e `EUROPEAN_SPLIT_SEASON` — se a API real começar a devolver times todos com 0 jogos/0 pontos, o valor de `season` está desatualizado (revisar a cada virada de temporada europeia, por volta de agosto).

## 6. Competições: catálogo real vs. registry estático

`competitionRegistry.ts` só lista competições que a football-data.org documenta oficialmente (`providerCompetitionCode` confirmado): Premier League (PL), Championship (ELC), La Liga (PD), Serie A Itália (SA), Bundesliga (BL1), Ligue 1 (FL1), Primeira Liga (PPL), Eredivisie (DED), Champions League (CL), Brasileirão Série A (BSA), Copa do Mundo (WC) e Eurocopa (EC). Qualquer outra competição (Série B, Copa do Brasil, Libertadores, Copa América, Mundial de Clubes, Sudamericana, MLS, segundas divisões europeias, copas nacionais) fica no registry como `needs_mapping` — sem código, nunca é enviada ao provedor real, e aparece só na área "Outras competições em análise" da home.

Mas ter um código no registry não garante acesso: `providers/footballDataProvider.ts` exporta `resolveCompetitionAvailability()`, que busca o catálogo real da football-data.org (`GET /v4/competitions`, cacheado 6h) e cruza com cada `providerCompetitionCode`:
- código encontrado no catálogo com `plan === "TIER_ONE"` → `status: "available"` (plano gratuito cobre);
- código encontrado mas com plano superior → `status: "unavailable_plan"` (mostrado como "Indisponível no plano atual", nunca tratado como disponível);
- código não encontrado no catálogo → `status: "needs_mapping"`;
- catálogo não pôde ser verificado (sem chave, erro de rede) → mantém o status base do registry; o mecanismo normal de fallback (seção 4) cuida do resto.

`GET /api/competitions` já devolve só as competições com `status: "available"` resolvido nesse momento; passe `?showUnavailable=true` para incluir as demais (usado pela seção "Outras competições em análise" da home).

## 7. Copa do Mundo 2026 (`copa-do-mundo`) e o `WorldCupMode`

O registry aponta para `providerCompetitionCode: "WC"`, `season: 2026`. Como o torneio de 2026 está em andamento, a football-data.org já retorna dados reais — mas o **modo de exibição** (`services/sportsData/worldCup.ts`) é resolvido dinamicamente a partir de `isMock` de standings e fixtures, para nunca apresentar a simulação como se fosse oficial:

- `official_data`: standings reais disponíveis → mostra a tabela (grupos, se o provedor os expuser) com "Fonte: football-data.org".
- `schedule_only`: só o calendário de jogos é real, standings ainda não → mostra os jogos com aviso "Dados de tabela ainda não disponíveis. Simulação baseada em estrutura pré-torneio."
- `simulation_only`: nem standings nem jogos reais → experiência de pré-torneio, deixando claro que é simulação manual.

**Observação real de cobertura**: o endpoint `/v4/competitions/WC/standings` da football-data.org devolve as 48 seleções em **uma única tabela combinada** (campo `group` vem `null` em cada linha) — ele não expõe os 12 grupos separadamente pela API. `GroupStandings`/`groupStandingsByGroup()` já lidam com isso (caem para uma única seção "Tabela geral" em vez de 12 mini-tabelas) — não é um bug do normalizador, é uma limitação real da resposta do provedor para este torneio.

`qualificationSpots: 32` reflete o formato de 48 seleções (12 grupos de 4; top 2 + 8 melhores terceiros avançam à fase de 32) — usado pelo motor de cálculo genérico (`pathEngine.ts`) como proxy de "zona de classificação" sobre a tabela combinada.

O `mockProvider` também simula 48 seleções para essa competição, mas **é só uma demonstração determinística** — nunca representa o resultado real do torneio.

**Importante**: standings e fixtures têm `isMock` **independentes** — é possível a tabela estar real (`official_data`) enquanto os jogos momentaneamente caem para mock (rate limit, timeout pontual no endpoint de matches, etc.), ou vice-versa. `app/copa-do-mundo-2026/page.tsx` verifica `fixtures.isMock` separadamente antes de renderizar a seção "Jogos e mata-mata" — nunca usa só o `mode` geral para essa decisão, exatamente para não acabar mostrando jogos mockados dentro de uma tela marcada como dados reais.

## 8. Busca de time entre competições (`/api/search-team`, `/api/team-competitions`)

`teamSearch.ts` agrega, sob demanda, os times de **todas** as competições atualmente `status: "available"` (via `getTeams()`, já cacheado), filtra por nome (case-insensitive) e agrupa por `teamId` — a football-data.org usa o mesmo ID numérico de time em todas as competições, então um time que aparece em duas competições (ex.: Arsenal na Premier League e na Champions League) é mesclado em um único resultado com as duas competições listadas.

Times cuja competição só retornou dados mockados (`isMock: true`) são **excluídos** do índice de busca — a busca nunca associa um time real a uma competição de forma fictícia. Isso também significa que, com o cache frio, a primeira busca após reiniciar o servidor pode consumir vários requests reais de uma vez (um por competição disponível); buscas seguintes reusam o cache de 30 min.

## 9. Como testar os endpoints internos

Com o servidor rodando (`npm run dev`):

```bash
curl "http://localhost:3000/api/competitions"
curl "http://localhost:3000/api/competitions?showUnavailable=true"
curl "http://localhost:3000/api/standings?competitionId=brasileirao-serie-a"
curl "http://localhost:3000/api/fixtures?competitionId=premier-league"
curl "http://localhost:3000/api/teams?competitionId=premier-league"
curl "http://localhost:3000/api/team-path?competitionId=premier-league&teamId=57"
curl "http://localhost:3000/api/search-team?query=flamengo"
curl "http://localhost:3000/api/team-competitions?teamId=1783"

# forçar nova busca (ignora cache)
curl "http://localhost:3000/api/standings?competitionId=premier-league&refresh=true"
```

Testes unitários das funções puras (motor de cálculo, cenários, normalizadores, cache, fallback):

```bash
npm run test
```

## 10. Como fazer deploy sem expor chaves

- Vercel: configure `FOOTBALL_DATA_KEY`, `SPORTS_DATA_PROVIDER`, `SPORTS_DATA_CACHE_TTL_SECONDS` e `SHOW_TECHNICAL_DATA_STATUS` em **Project Settings → Environment Variables**. Nunca prefixe essas variáveis com `NEXT_PUBLIC_` — isso as exporia no bundle do navegador.
- Netlify: configure as mesmas variáveis em **Site settings → Environment variables**.
- Nenhuma chave é lida fora de `src/app/api/*` e `src/services/sportsData/providers/footballDataProvider.ts`, ambos executados exclusivamente no servidor.

## 11. Campos derivados de exibição (`form`, `nextMatch`, `percentage`)

`/api/standings` e `/api/team-path` passam os `TeamStanding[]` por `enrichStandings()` (`calculations/standingsEnrichment.ts`) antes de responder:

- `percentage`: sempre calculado (`points / (played * 3) * 100`).
- `form`: derivado das últimas 5 partidas finalizadas nos fixtures já buscados.
- `nextMatch`: derivado do primeiro fixture não finalizado, formatado como `vs {adversário} (dd/mm)`.

Isso roda igual para dados reais ou mockados.

## Competições que ainda precisam de código confirmado

Estas entradas estão como `status: "needs_mapping"` no registry (sem `providerCompetitionCode`) e ficam fora da listagem principal da home, em "Outras competições em análise": Brasileirão Série B, Copa do Brasil, Copa Conmebol Libertadores, Copa América, Mundial de Clubes FIFA, Copa Sudamericana, MLS, Segunda División (Espanha), Serie B Itália, Ligue 2, 2. Bundesliga, DFB-Pokal, FA Cup, Copa del Rey, Coppa Italia. A football-data.org não documenta publicamente a maioria dessas — nenhum código foi inventado; confirme em `GET https://api.football-data.org/v4/competitions` antes de promover qualquer uma delas.
