# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Aviso sobre a versão do Next.js

@AGENTS.md

Concretamente: antes de escrever ou editar páginas do App Router / route handlers, confira `node_modules/next/dist/docs/` para o comportamento real desta versão instalada, em vez de assumir conhecimento prévio.

## 1. Descrição do projeto

**Rota do Campeão** é uma plataforma web esportiva: o usuário pesquisa o nome do seu time, descobre em quais competições disponíveis ele participa, abre a tabela da competição, consulta os jogos restantes e simula o caminho até o título, a classificação ou a fuga do rebaixamento — com cenários otimista/realista/pessimista e compartilhamento por link, WhatsApp ou imagem. A busca de time é o ponto de entrada central da experiência (Hero da home), não a navegação por menus.

## 2. Framework e stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict).
- **Tailwind CSS v4** (tokens de tema via `@theme`/`@theme inline` em `src/app/globals.css`, não `tailwind.config.js`).
- **lucide-react** para todos os ícones — nunca emoji na interface.
- **Vitest** para testes unitários.
- **ESLint 9** (`eslint-config-next` + regra customizada, ver `eslint.config.mjs`).
- Sem banco de dados — estado persistido só via cache em memória (server) e `localStorage` (preferências do usuário, nunca segredos).
- Fonte de dados real: **football-data.org** (único provedor ativo — ver seção 5).

## 3. Comandos principais

```bash
npm install      # instalar dependências
npm run dev      # servidor de desenvolvimento (Turbopack) em http://localhost:3000
npm run build    # build de produção — precisa passar com zero erros de TypeScript
npm run start    # roda o build de produção localmente (depois de `npm run build`)
npm run lint     # eslint
npm run test     # vitest run — todos os *.test.ts em src/**
npx vitest run path/to/file.test.ts   # rodar um único arquivo de teste
npx tsc --noEmit # só type-check, sem gerar build
```

Não há script de watch para os testes; use `npx vitest` (sem `run`) para modo watch.

## 4. Estrutura das pastas principais

```
src/
  app/
    page.tsx                          home simplificada (Server Component): Hero+busca, competições
                                       disponíveis, "Como funciona" (3 passos), FAQ
    layout.tsx                        layout raiz + Header global + metadata/fontes padrão
    not-found.tsx                     404 com o mesmo tema visual (usado por notFound())
    api/                              route handlers server-only (competitions, standings,
                                       fixtures, teams, team-path, search-team, team-competitions)
    competicao/[competitionId]/
      page.tsx                        Server Component: valida a competição (notFound() se
                                       não existir) + generateMetadata (title/OG/Twitter/canonical)
      CompetitionPageClient.tsx        lógica client real: abas Tabela/Jogos/Simulador/
                                       Estatísticas/Times, fetch, estados de erro/loading/vazio
      time/[teamId]/
        page.tsx                      idem: valida competição + generateMetadata dinâmica
                                       (busca o nome do time via getStandings para o <title>)
        TeamPathClient.tsx             lógica client real da análise do time
  components/                        componentes de UI reutilizáveis (ver seção 6)
  lib/
    shareState.ts                    estado compartilhável via URL
    userPreferences.ts               wrapper de localStorage
    apiErrors.ts                     forma padrão de erro de todas as rotas internas — ver seção 5
  services/sportsData/
    types.ts                         tipos internos (Competition, TeamStanding, Fixture,
                                       PathAnalysis, ScenarioResult, TeamSearchResult...)
    sportsDataService.ts             orquestra cache → football-data.org → fallback mock
    teamSearch.ts                    agrega times de todas as competições disponíveis (busca)
    providers/
      httpClient.ts                  fetch com timeout e tradução de erros HTTP
      footballDataProvider.ts        integração com football-data.org + validação de plano
      mockProvider.ts                gera temporadas demonstrativas determinísticas
      apiFootballProvider.ts         isolado, não usado (ver seção 5)
    normalizers/                     JSON externo → tipos internos
    cache/memoryCache.ts             cache em memória com TTL
    calculations/
      pathEngine.ts                  caminho para título/classificação/rebaixamento
      scenarioEngine.ts              cenários otimista/realista/pessimista
      standingsEnrichment.ts         preenche form/nextMatch/percentage
    competitions/competitionRegistry.ts   catálogo de competições e códigos football-data.org
    __tests__/                       testes unitários (vitest)
docs/api-integrations.md             referência completa de provedores/cache/fallback
design/                              export de referência visual (NÃO versionado, ver .gitignore)
```

Não existe mais tela de Copa do Mundo — foi removida por completo (rota, componente `GroupStandings`, helper `worldCup.ts`, dados mock, item de menu, FAQ). Não recrie nada relacionado sem pedido explícito.

## 5. Padrões de código

### Fluxo de dados (a regra mais importante do projeto)

Chaves de API nunca chegam ao navegador. Todo dado passa por:

```
Client components (fetch("/api/...")) 
  → src/app/api/*/route.ts (route handlers, server-only)
  → sportsDataService.ts (cache? → football-data.org? → mock)
  → providers/{footballDataProvider,mockProvider}.ts
  → normalizers/footballDataNormalizer.ts
  → cache/memoryCache.ts
  → ServiceEnvelope<T> { data, source, isMock, updatedAt, warning?, cached?, showTechnicalStatus? }
```

`sportsDataService.ts` nunca lança erro para quem chama — qualquer falha (chave ausente/inválida, rate limit, competição não mapeada, dados incompletos, timeout) vira uma resposta **mock** com `isMock: true`. A aplicação funciona 100% sem nenhuma variável de ambiente configurada. Cada busca loga uma linha `[sportsData] ...` no console do servidor (provider tentado, se a chave foi *encontrada*, cache hit, motivo do fallback) — nunca o valor da chave.

**football-data.org é o único provedor de dados reais** (`SPORTS_DATA_PROVIDER` só aceita `football-data` ou `mock`; qualquer outro valor, incluindo o legado `api-football`, cai em mock). `providers/apiFootballProvider.ts` ainda existe no repo mas está **desconectado** de `sportsDataService.ts` e da UI — não reconecte sem decisão explícita.

### Forma padrão de erro das rotas internas (`src/lib/apiErrors.ts`)

Toda rota em `src/app/api/*/route.ts` que recebe um `competitionId`/`teamId` **valida a existência antes de chamar `sportsDataService`** (via `getCompetitionById` do registry) e, em qualquer falha, responde sempre `{ error: ApiErrorCode, message: string }` com o status HTTP correto (`competitionNotFoundResponse`, `teamNotFoundResponse`, `apiError(...)`). **Nunca** deixe uma rota devolver um objeto parcial sem os campos que o sucesso teria — foi exatamente essa inconsistência (`/api/team-path` devolvendo `{ error }` sem `competition` em vez de um objeto tipado) que causava `Cannot read properties of undefined (reading 'season')` no front, porque o cliente não checava `res.ok`/`"error" in json` antes de usar a resposta como se fosse válida.

No client, sempre trate a resposta como uma união discriminada: cheque `res.ok` (ou `"error" in json`) **antes** de acessar qualquer campo de sucesso. Veja `TeamPathClient.tsx` e `CompetitionPageClient.tsx` para o padrão de estados `loading | success | error` com UI de erro amigável (botões "Tentar novamente" / "Voltar" / "Escolher outro time").

### Metadata dinâmica exige um wrapper Server Component

As páginas de competição e de time são interativas (abas, refresh, cenários) e por isso os arquivos `CompetitionPageClient.tsx`/`TeamPathClient.tsx` são `"use client"` — mas `generateMetadata` só pode ser exportado de um Server Component. Por isso `page.tsx` em cada uma dessas rotas é um Server Component fino que só: valida a competição/time (`notFound()` se não existir), exporta `generateMetadata` (busca o nome do time via `getStandings()` direto do service, sem round-trip HTTP), e renderiza o Client Component correspondente. Ao mexer nessas páginas, não tente fundir a lógica client de volta no `page.tsx` — isso quebraria a metadata dinâmica.

### Armadilhas conhecidas (não "simplifique" sem entender o motivo)

- **`httpClient.ts` mapeia HTTP 400 para `invalid_key`**, não só 401/403 — a football-data.org retorna 400 para token inválido/expirado.
- **`season` não é só o ano corrente**: ligas europeias de calendário partido (`EUROPEAN_SPLIT_SEASON`, ex. Premier League) usam o ano de *início* da temporada (2025-26 = `season=2025`), enquanto o Brasileirão usa o ano civil (`CALENDAR_YEAR_SEASON`). Errar isso não gera erro — só devolve a próxima temporada com todo mundo 0x0.
- Competição com `status: "needs_mapping"` (sem `providerCompetitionCode` confirmado) nunca é enviada à API real — nunca invente códigos, deixe `needs_mapping` até confirmar contra `GET https://api.football-data.org/v4/competitions`.
- `resolveCompetitionAvailability()` (`footballDataProvider.ts`) cruza o registry com o catálogo real da football-data.org para marcar `unavailable_plan` quando o código existe mas exige plano pago — isso é cacheado 6h.
- O plano gratuito da football-data.org tem limite de **10 requisições/minuto** — `/api/search-team` faz fan-out sobre todas as competições disponíveis e pode esgotar a cota com cache frio. Sob rate limit, `sportsDataService` cai em mock normalmente (nunca quebra), mas isso pode fazer um `teamId` numérico real "sumir" temporariamente da tabela até o cache real ser reconquistado.
- `mockProvider.ts` gera uma temporada determinística completa (PRNG com seed) e deriva a tabela agregando os jogos simulados — nunca são dados estáticos soltos.
- `ApiWarningBanner` **sempre** aparece quando `isMock` é verdadeiro — isso é um requisito de confiança do produto ("nunca apresentar dados demonstrativos como oficiais"), não um detalhe de debug. Só `DataStatusPanel` (o painel técnico com provider/cache/fallback) é opcional, controlado por `SHOW_TECHNICAL_DATA_STATUS`.
- `calculatePointsNeededToAvoidRelegation` retorna `null` quando `competition.hasRelegation` é falso — quem chama deve tratar o caso nulo omitindo o bloco, não renderizando um vazio.
- Referência completa de provedores/cache/fallback: `docs/api-integrations.md`.

### Convenções gerais

- TypeScript estrito; sem `any` solto. Tipos internos centralizados em `services/sportsData/types.ts`.
- Sem comentários explicando o óbvio — só quando há uma restrição não óbvia (ver exemplos acima nos arquivos citados).
- Funções de cálculo (`pathEngine.ts`, `scenarioEngine.ts`) são puras: recebem `(team, standings, fixtures, competition)`, sem estado externo, o que as torna fáceis de testar isoladamente.
- Parâmetros prefixados com `_` são intencionalmente não usados (paridade de interface entre providers/normalizers) — não é erro de lint (ver `eslint.config.mjs`).

## 6. Regras de UI e design

- **Identidade visual única e escura** (não há mais alternância light/dark): fundo preto/grafite (`bg-ink`/`bg-graphite`/`bg-surface`), texto branco/cinza-claro (`text-white`/`text-muted`/`text-muted-2`), verde-limão (`bg-lime`/`text-lime`/`hover:bg-lime-dark`) como cor de destaque única para CTAs e links ativos. Vermelho/âmbar/azul/verde (`text-danger`/`text-warning`/`text-blue-400`/`text-success`) só para zonas de risco na tabela e estados de dados. Esses tokens vêm de `@theme` em `globals.css` — não reintroduza classes `neutral-*`/`emerald-*`/`dark:` do Tailwind (foram completamente removidas nessa migração).
- Tipografia: `font-display` (Oswald, carregada via `next/font/google` em `layout.tsx`) para títulos/números grandes, geralmente `uppercase`; `font-sans` (Inter) para o corpo do texto.
- Ícones: só `lucide-react`, nunca emoji.
- Client Components (`"use client"`) só onde há interatividade real (abas, busca, refresh, localStorage). As páginas de competição e time usam o padrão wrapper Server Component + Client Component descrito na seção 5.
- Transparência de dados é obrigatória e explícita: `DataSourceBadge` tem 3 estados (`isMock=false` → "Dados oficiais atualizados", verde; `isMock=true` → "Dados demonstrativos", âmbar; array vazio → "Dados indisponíveis", cinza) — nunca afirme "dados reais" em outro lugar da UI se o badge não confirmar isso. `ApiWarningBanner` reforça o aviso textual sempre que `isMock` é verdadeiro.
- Responsividade mobile-first: a tabela de classificação vira lista de cards com posição/time/pontos/jogos/saldo visíveis e o resto atrás de um toggle (`aria-expanded`) — nunca oculte posição/nome do time durante rolagem horizontal no desktop (colunas `sticky left-0`/`left-8`). Menu do Header colapsa em hambúrguer abaixo do breakpoint `sm`. Botão de compartilhar vira barra fixa no rodapé em mobile na página do time.
- Acessibilidade: FAQ usa `button` com `aria-expanded`/`aria-controls` (não `<details>`); busca de time é um combobox ARIA completo (`role="combobox"`, `aria-activedescendant`, navegação por seta/Enter/Escape); todo ícone decorativo leva `aria-hidden="true"`; existe link "Pular para o conteúdo" em `layout.tsx`; `prefers-reduced-motion` é tratado globalmente em `globals.css`, não por componente.
- `AdSlot` recebe `placement`/`format`/`minHeight` (nunca `type`/`label`) — em desenvolvimento mostra "Espaço publicitário" discreto; em produção colapsa para uma tira mínima (nenhum ad network real está integrado — não adicione IDs fictícios de AdSense).
- Componentes de UI reutilizáveis vivem em `src/components/` e são pequenos e focados — ver `DataSourceBadge`, `CompetitionStatusBadge`, `ApiWarningBanner`, `DataStatusPanel`, `StandingsTable`, `FixturesList`, `CompetitionStats`, `PathAnalysisCard`, `ShareButtons`, `Tabs`, `AdSlot`, `TeamSearch`, `Header`, `Hero`, `HowItWorks`, `FaqSection`.
- Existe um export de design de referência em `design/claude-design-export.zip` (não versionado, ver .gitignore) — não é a identidade visual atual (que segue a paleta preto/grafite/verde-limão desta seção); não assuma que aquele redesign está implementado.

## 7. Como publicar no GitHub

Repositório já existe e está conectado: **https://github.com/tiagoarouchearouche/rota-do-campeao** (branch `master`, remote `origin`).

Fluxo usado (GitHub CLI, autenticado via `gh auth login`):

```bash
git add -A
git commit -m "mensagem do commit"
git push origin master
```

Para criar um novo repositório do zero (se necessário no futuro):

```bash
gh repo create NOME-DO-REPO --public --source=. --remote=origin --push
```

`gh` está instalado em `C:\Program Files\GitHub CLI\gh.exe` (pode não estar no PATH de toda sessão de shell — use o caminho completo se `gh` não for encontrado).

## 8. Como publicar na Vercel

Feito pelo painel web (sem CLI), fluxo padrão de import:

1. https://vercel.com/new → conectar a conta GitHub `tiagoarouchearouche`.
2. Importar o repositório `rota-do-campeao`. O preset **Next.js** é detectado automaticamente — não alterar build/output command.
3. Antes de clicar em Deploy, configurar as **Environment Variables** (mesmas do `.env.local`, nunca commitadas):

   | Nome | Valor |
   |---|---|
   | `FOOTBALL_DATA_KEY` | chave real da football-data.org |
   | `SPORTS_DATA_PROVIDER` | `football-data` |
   | `SPORTS_DATA_CACHE_TTL_SECONDS` | `1800` |
   | `SHOW_TECHNICAL_DATA_STATUS` | `false` |

4. Deploy. Cada push em `master` no GitHub aciona um novo deploy automático.

## 9. Cuidados obrigatórios

- **Nunca exponha `.env`, `.env.local` ou qualquer chave/token** — eles já estão no `.gitignore` (`.env*`); confirme com `git status`/`git ls-files | grep env` antes de qualquer commit se mexer nesses arquivos.
- **Nunca commite `node_modules`** — já ignorado via `.gitignore` (`/node_modules`); se aparecer em `git status`, é sinal de que o `.gitignore` foi alterado por engano.
- **Nunca apague funcionalidades existentes sem autorização explícita do usuário** — isso inclui rotas, componentes, fallback mockado, ou qualquer comportamento já implementado. Se uma mudança pedida exigir remover algo funcional, explique o trade-off antes de fazer.
- Nunca logue o valor de `FOOTBALL_DATA_KEY` (ou de qualquer chave) em `console.log` — só sua presença/ausência (ver `logDataFetch` em `sportsDataService.ts` como exemplo do padrão correto).
- A pasta `design/` (export de referência visual) não deve ser versionada — está no `.gitignore` intencionalmente.
