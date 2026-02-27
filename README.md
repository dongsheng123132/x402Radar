# x402 Monitor

Chain monitoring and analytics platform for x402 payments. Tracks on-chain USDC transfers via known facilitator addresses, aggregates agents/sellers/facilitator stats, and provides a dashboard plus leaderboards.

See [CURSOR.md](./CURSOR.md) for full product spec and x402 protocol notes.

## Tech stack

- **Next.js 15** (App Router), TypeScript, Tailwind CSS
- **Prisma** + **Supabase** (PostgreSQL)
- **viem**, **Recharts**
- Cron: Vercel Cron (or external worker calling API routes)

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Supabase PostgreSQL connection string |
| `CDP_API_KEY` | Coinbase Developer Platform API key (for chain sync via CDP Data API) |
| `CRON_SECRET` | Random secret; cron routes check `Authorization: Bearer <CRON_SECRET>` or `?secret=<CRON_SECRET>` |
| `BASE_RPC_URL` | (Optional) Base RPC for fallback indexer |
| `NEXT_PUBLIC_BASE_URL` | (Optional) Public base URL for SSR/links |

## Local setup

```bash
pnpm install
cp .env.example .env.local
# Edit .env.local with DATABASE_URL and optionally CDP_API_KEY, CRON_SECRET

pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Dashboard** (`/`): global stats, volume chart, top agents/sellers, latest transactions.
- **Agents** (`/agents`): leaderboard by spend; `/agents/[address]` for detail.
- **Sellers** (`/sellers`): leaderboard by received; `/sellers/[address]` for detail.
- **Transactions** (`/transactions`): paginated list, optional chain filter.
- **Facilitators** (`/facilitators`): list and `/facilitators/[id]` for stats by period.

## Cron jobs (indexer)

Two API routes are intended to be called on a schedule:

1. **Sync transfers** – `GET /api/cron/sync-transfers`  
   Pulls USDC Transfer events from CDP API (by facilitator address), writes to `transfer_events`, updates sync cursors.  
   **Suggested schedule:** every 1 minute (Vercel Pro required for minute-level; otherwise use an external worker).

2. **Aggregate stats** – `GET /api/cron/aggregate-stats`  
   Recomputes `agents`, `sellers`, `facilitator_stats`, `daily_stats` from `transfer_events`.  
   **Suggested schedule:** every 10 minutes.

**Auth:** If `CRON_SECRET` is set, call with either:

- Header: `Authorization: Bearer <CRON_SECRET>`
- Or query: `?secret=<CRON_SECRET>`

Example (replace with your host and secret):

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://your-app.vercel.app/api/cron/sync-transfers"
curl -H "Authorization: Bearer YOUR_CRON_SECRET" "https://your-app.vercel.app/api/cron/aggregate-stats"
```

## Build

`pnpm build` requires `DATABASE_URL` to be set (Prisma initializes at build time). Use a placeholder if you only need a build without a real DB, e.g. `DATABASE_URL="postgresql://u:p@localhost:5432/d?schema=public" pnpm build`.

## Deploy (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Set environment variables (e.g. `DATABASE_URL`, `CDP_API_KEY`, `CRON_SECRET`).
3. Deploy. Cron triggers are defined in `vercel.json`; **Vercel Hobby** only supports daily cron. For minute/10-minute schedules use **Vercel Pro** or an external cron (e.g. Railway/Render worker) that hits the URLs above.

## Facilitator addresses

The indexer only ingests transfers where `transaction_from` is a configured facilitator address. Default config uses a small placeholder set in `src/lib/facilitators/addresses.ts`. For production, replace with the full list (e.g. from x402scan’s facilitators package or [facilitators.x402.watch](https://facilitators.x402.watch)).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm start` | Start production server |
| `pnpm db:push` | Push Prisma schema to DB (no migrations) |
| `pnpm db:generate` | Generate Prisma client |
| `pnpm db:seed` | Seed facilitators and addresses |

## Phase 2 (future)

- Discovery sync and Resources page
- Agent/Seller detail trend charts and flow graph
- Agent credit score
- Multi-chain (Polygon, etc.)
