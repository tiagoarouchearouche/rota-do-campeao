# Rota do Campeão

Plataforma web que mostra a rota necessária para um time ser campeão, se classificar ou escapar do rebaixamento, com cenários otimista/realista/pessimista e compartilhamento por link, WhatsApp e imagem.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). **Não é necessário nenhuma chave de API** — a aplicação roda em modo demonstração (dados mockados) por padrão.

## Ativando dados oficiais

A **football-data.org** é a única fonte de dados reais deste projeto.

```bash
cp .env.example .env.local
```

Preencha `FOOTBALL_DATA_KEY` (crie uma chave gratuita em https://www.football-data.org/client/register) e mantenha `SPORTS_DATA_PROVIDER=football-data`. Veja o guia completo em [`docs/api-integrations.md`](docs/api-integrations.md).

**Importante sobre o `.env.local`:**
- Fica na **raiz do projeto**, no mesmo nível de `package.json` — nunca dentro de `src/`.
- Depois de criar ou editar o arquivo, **pare o servidor (Ctrl+C) e rode `npm run dev` de novo**. O Next.js só lê variáveis de ambiente na inicialização do processo.
- Este projeto é **Next.js App Router**, não Vite. As rotas em `src/app/api/*/route.ts` já rodam como parte do próprio `npm run dev` — **não é preciso `vercel dev`, `vercel login` nem criar conta na Vercel** para testar localmente. Uma conta na Vercel (ou serviço equivalente) só é necessária se você quiser fazer deploy nesse provedor específico; para rodar e testar tudo localmente, `npm run dev` já é suficiente.

## Como confirmar se está usando dados reais ou mock

```bash
curl "http://localhost:3000/api/standings?competitionId=brasileirao-serie-a&refresh=true"
```

Olhe os campos `source` e `isMock` na resposta:
- `"source": "football-data"` e `"isMock": false` → dados reais.
- `"source": "mock"` e `"isMock": true` → caiu no fallback demonstrativo.

Se cair em mock com a chave configurada, veja os logs do terminal onde `npm run dev` está rodando — cada busca imprime uma linha `[sportsData] ...` com o provider tentado, se a chave foi encontrada (nunca o valor), e o motivo do fallback (`reason=...`, ex. `invalid_key`, `rate_limited`, `not_mapped`). Causas mais comuns: competição ainda em `needs_mapping` ou fora do plano gratuito, chave inválida/expirada, **limite de 10 requisições/minuto do plano gratuito atingido** (a busca de time consulta várias competições de uma vez com cache frio), ou a temporada (`season`) ainda sem dados publicados pelo provedor.

## Scripts

```bash
npm run dev     # servidor de desenvolvimento
npm run build   # build de produção
npm run lint    # eslint
npm run test    # testes unitários (vitest)
```

## Arquitetura

A camada de dados esportivos (provedores externos, normalização, cache, fallback mockado e motores de cálculo/cenários) está documentada em detalhe em [`docs/api-integrations.md`](docs/api-integrations.md).

## SEO

- Metadata (title/description/canonical/Open Graph/Twitter Card) é gerada por rota: estática nas páginas institucionais e em `/brasileirao/*`, dinâmica (via `generateMetadata`) em `/brasileirao/time/[slug]`.
- `src/lib/siteConfig.ts` centraliza `siteName`/`baseUrl`/`description` — `layout.tsx`, `sitemap.ts` e `robots.ts` leem tudo daqui.
- JSON-LD (`src/lib/jsonLd.ts`): `WebSite` no layout raiz, `BreadcrumbList` nas páginas internas, `FAQPage` onde há FAQ real (home e `/brasileirao/simulador`).
- URLs de time são slugs legíveis (`/brasileirao/time/flamengo`), resolvidos por `src/lib/teamSlug.ts`. A antiga `/time/[teamId]` (numérica) continua funcionando como redirect 301 permanente.

## Sitemap e robots.txt

Gerados nativamente pelo App Router (`src/app/sitemap.ts`, `src/app/robots.ts` — sem dependência extra), em `/sitemap.xml` e `/robots.txt`. O sitemap inclui a home, as páginas institucionais, `/brasileirao/*` e os slugs dos 20 times (buscados em tempo de request). Nada a configurar manualmente.

## Google Search Console

1. Defina `NEXT_PUBLIC_SITE_URL` com o domínio final (ex. `https://rota-do-campeao.vercel.app` ou o domínio próprio).
2. Adicione a propriedade no [Search Console](https://search.google.com/search-console) e verifique por DNS ou pelo arquivo HTML de verificação do Google (não incluído aqui — baixe o arquivo real fornecido pelo Google e coloque em `public/`).
3. Envie `https://<seu-domínio>/sitemap.xml` na seção Sitemaps.

## Google AdSense

A estrutura está preparada, mas **nenhum anúncio real está conectado** — `src/components/AdSlot.tsx` só reserva espaço (placeholder em dev, colapsa em produção) nos 4 pontos definidos em `src/app/BrasileiraoHomeClient.tsx` (`after-team-summary`, `after-standings`, `before-if-ended-today`, `desktop-sidebar`). Para ativar de fato:

1. Crie a conta no [Google AdSense](https://www.google.com/adsense/) e aprove o site.
2. Preencha `NEXT_PUBLIC_ADSENSE_CLIENT_ID` com o ID real (`ca-pub-...`) — isso é só o que falta para `siteConfig.adsEnabled` virar `true`.
3. Adicione o script/slot real do AdSense dentro de `AdSlot.tsx` (hoje ele só decide mostrar um placeholder ou nada — o `<script>`/`<ins>` do AdSense entra ali, condicionado a `siteConfig.adsEnabled`).

## ads.txt

`public/ads.txt` já existe com a linha oficial da conta AdSense do site (`google.com, pub-3395148434417478, DIRECT, f08c47fec0942fa0`), servida em `/ads.txt`. Se a conta AdSense mudar (nova conta, novo publisher ID), atualize esse arquivo com o valor exato que o painel do Google fornecer.

## Analytics

`src/lib/analytics.ts` expõe `trackEvent(name, params)` já chamado nos pontos-chave (`select_team`, `simulate_match`, `share_team`, `compare_teams`) — hoje é no-op porque nenhum analytics está instalado. Para ativar:

1. Crie uma propriedade GA4 e preencha `NEXT_PUBLIC_GA_ID` (`G-XXXXXXXXXX`).
2. Adicione o loader do `gtag.js` (ex. via `next/script` em `layout.tsx`, condicionado a `siteConfig.analyticsEnabled`) — a partir daí `trackEvent` passa a funcionar sem mexer em mais nada.

## Domínio próprio

Nada no código depende do domínio `rota-do-campeao.vercel.app`. Basta trocar `NEXT_PUBLIC_SITE_URL` (local e nas Environment Variables da Vercel) para o domínio final — metadata, sitemap, robots e JSON-LD seguem automaticamente.
