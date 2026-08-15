# Conch

Decentralized AI identity and memory platform. Own, manage, and carry your AI memory across apps, devices, chains, and agents.

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion
- **Auth**: Clerk (Google OAuth + magic link)
- **Database**: PostgreSQL via Prisma (Supabase recommended)
- **AI**: OpenAI GPT-4o + Vercel AI SDK (streaming)
- **Vector DB**: Pinecone (semantic memory retrieval)
- **Web3**: RainbowKit + Wagmi + WalletConnect (Base chain)

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in the required values:

| Variable | Where to get it |
| -------- | --------------- |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (Transaction mode) |
| `DIRECT_URL` | Supabase → Settings → Database → Connection string (Session mode) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk Dashboard → API Keys |
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys |
| `CLERK_WEBHOOK_SECRET` | Clerk Dashboard → Webhooks |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `PINECONE_API_KEY` | app.pinecone.io → API Keys |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | cloud.walletconnect.com |

### 3. Set up Pinecone index

Create a serverless index with:

- **Name**: `conch-memories`
- **Dimensions**: `1536` (OpenAI `text-embedding-3-small`)
- **Metric**: `cosine`
- **Cloud**: AWS us-east-1

### 4. Set up Clerk

In the Clerk dashboard:

1. Enable **Google OAuth** and **Email magic link** sign-in methods
2. Set **After sign-in URL** to `/dashboard`
3. Set **After sign-up URL** to `/dashboard`
4. Create a webhook pointing to `{APP_URL}/api/webhooks/clerk` with events:
   - `user.created`
   - `user.updated`
   - `user.deleted`

### 5. Push database schema

```bash
npx prisma db push
```

### 6. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment (Vercel + Supabase)

1. Push to GitHub
2. Import the repo in Vercel
3. Add all environment variables from `.env.example`
4. Deploy — `vercel.json` sets 60s max duration for the chat streaming route

## Architecture

```text
src/
├── app/
│   ├── (auth)/          # Sign in/up pages
│   ├── (dashboard)/     # Protected app pages
│   │   ├── chat/        # AI chat with streaming
│   │   ├── memory/      # Memory management
│   │   ├── agents/      # Custom AI agents
│   │   ├── wallet/      # Web3 identity
│   │   └── settings/    # Profile, API keys, etc.
│   └── api/             # API routes
├── components/
│   ├── ui/              # Shadcn-style base components
│   ├── shared/          # Reusable cross-feature components
│   ├── landing/         # Landing page sections
│   ├── dashboard/       # Layout shell components
│   ├── chat/            # Chat feature components
│   ├── memory/          # Memory feature components
│   ├── agents/          # Agents feature components
│   ├── settings/        # Settings feature components
│   └── wallet/          # Wallet feature components
├── hooks/               # useChat, useMemory, useAgent
├── lib/                 # prisma, openai, pinecone, memory utils
└── types/               # Shared TypeScript types
```

### Memory Architecture

Memories are stored in two layers:

1. **PostgreSQL** (source of truth) — full memory record with metadata
2. **Pinecone** (vector index) — embeddings for semantic search

On every chat request, the system embeds the user's message, queries Pinecone for the top-5 most relevant memories (score ≥ 0.65), and injects them into the system prompt.

### API Key Format

Keys use the format `cnch_<64 hex chars>`. The full key is shown exactly once on creation; only a bcrypt hash is stored in the database.

### External Memory API

Authenticate with `Authorization: Bearer cnch_...` (scopes: `FULL`, `MEMORY_READ`, `MEMORY_WRITE`, `CHAT`). Interactive docs live at `/developers`.

- `POST /api/memory` — save a memory (`namespace` isolates projects/clients; `relatedMemoryIds` links it to other memories — links are bidirectional, each target gets a back-link — or it auto-links to the most similar one)
- `GET /api/memory` — list (filter by `category`, `namespace`, `archived`)
- `POST /api/search` — semantic search (optionally scoped to a `namespace`)
- `POST /api/memory/recall` — search + a prompt-ready `context` block for AI apps (expands through relationship links)
- `GET /api/memory/export` — download all memories as JSON
- `PATCH` / `DELETE /api/memory/{id}` — update / delete (link changes keep back-links in sync; delete strips stale back-links from linked memories)

API-key memory mutations and key lifecycle events are written to the `audit_logs` collection. Adding the `namespace` attribute requires the migration: `npx tsx scripts/add-memory-namespace.ts`.
