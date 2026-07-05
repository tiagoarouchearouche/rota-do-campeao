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

Para ver quais competições estão realmente disponíveis no seu plano agora: `curl "http://localhost:3000/api/competitions?showUnavailable=true"`.

## Scripts

```bash
npm run dev     # servidor de desenvolvimento
npm run build   # build de produção
npm run lint    # eslint
npm run test    # testes unitários (vitest)
```

## Arquitetura

A camada de dados esportivos (provedores externos, normalização, cache, fallback mockado e motores de cálculo/cenários) está documentada em detalhe em [`docs/api-integrations.md`](docs/api-integrations.md).
