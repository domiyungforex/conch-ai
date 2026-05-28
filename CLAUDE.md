# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server with Turbopack (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx tsx scripts/setup-appwrite-db.ts   # One-time: create all Appwrite collections + attributes
```

No test suite exists. Install deps with `--legacy-peer-deps` due to React 19 peer dep conflicts.

## Architecture

**Framework**: Next.js 15 App Router, React 19, TypeScript, Tailwind v4.

**Route groups**:
- `src/app/(auth)/` — sign-in and sign-up pages (public, no layout)
- `src/app/(dashboard)/` — all authenticated pages sharing a sidebar layout
- `src/app/api/` — REST API routes (all server-side)

**Auth** (`src/lib/appwrite.ts` / `src/lib/appwrite-client.ts`):
- Appwrite Cloud handles auth. Server-side: `auth()` returns `{ userId }` from the session cookie. Client-side: `account` singleton from `appwrite-client.ts`.
- Middleware (`src/middleware.ts`) does a cookie-presence check only — no Appwrite round-trip at the edge. Actual session verification happens inside each API route via `auth()`.
- Sign-up creates the `users` document synchronously in `POST /api/auth/sign-up` — no webhook delay. If DB write fails, the Appwrite account is rolled back.

**Database** (`src/lib/db.ts`, `src/lib/appwrite.ts`):
- Appwrite Databases (NoSQL). `COLLECTIONS` constants and TypeScript doc types are in `src/lib/db.ts`.
- The Appwrite auth `$id` IS the `users` document `$id` — no join needed. All routes get `appwriteId` from `auth()` and use it directly as the user document ID.
- Documents are returned as `AppwriteDoc<T>` which has `$id`, `$createdAt`, `$updatedAt` (strings) plus all domain fields.
- No atomic increment: fetch-then-update for reputation counters.
- Setup: run `npx tsx scripts/setup-appwrite-db.ts` once after adding `APPWRITE_DATABASE_ID` to `.env`.

**Memory pipeline** (`src/lib/memory.ts`):
- Memories are stored in Appwrite (source of truth) and mirrored to Pinecone for vector search.
- `retrieveRelevantMemories(userId, query, topK, category, minScore=0.65)` — queries Pinecone then hydrates from Appwrite `Query.equal('pineconeId', ids)`.
- `buildSystemPrompt(agentSystemPrompt, memories)` — assembles the final system prompt for chat.

**AI chat** (`src/app/api/chat/route.ts`):
- Uses Vercel AI SDK `streamText` with `@ai-sdk/openai`. Response is a data stream with an `X-Conversation-Id` header injected for client-side URL routing.
- Client hook `useChat` (`src/hooks/useChat.ts`) reads that header to update the URL on new conversations.

**Rate limiting** (`src/lib/rateLimit.ts`):
- In-memory `Map` keyed on `{feature}:{userId}` (e.g., `chat:xyz`, `memory:create:xyz`). Resets per window. Not persisted — resets on server restart.

**Wallet** (`src/app/api/wallet/route.ts`):
- Links a wallet address via `viem.verifyMessage` signature check. Stored in `wallets` collection. Chain: Base (chainId 8453). RainbowKit + Wagmi v2 on the client (`src/providers/Web3Provider.tsx`).

**API keys** (`src/app/api/api-keys/`):
- User-created keys with `cnch_` prefix. Raw key shown once at creation; bcrypt hash stored. Scopes: `FULL`, `MEMORY_READ`, `MEMORY_WRITE`, `CHAT`.

**Validation** (`src/lib/validators.ts`):
- All API request bodies validated with Zod schemas before any DB or service call.

## Key env vars

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_APPWRITE_ENDPOINT` | Appwrite API endpoint |
| `NEXT_PUBLIC_APPWRITE_PROJECT_ID` | Appwrite project ID |
| `APPWRITE_API_KEY` | Server-only API key (users.read + users.write + databases) |
| `APPWRITE_DATABASE_ID` | ID of the Appwrite database (create in console, then run setup script) |
| `APPWRITE_SESSION_COOKIE` | Cookie name (default: `appwrite-session`) |
| `OPENAI_API_KEY` | GPT-4o for chat + text-embedding-3-small for vectors |
| `PINECONE_API_KEY` / `PINECONE_INDEX_NAME` | Vector store (index: `conch-memories`, dim 1536) |

## Notable constraints

- `node-appwrite` (server SDK) requires Node.js runtime — cannot run in the Edge runtime. Keep middleware lightweight (cookie check only).
- Appwrite's user model has a single `name` string field — no `firstName`/`lastName`. The profile page splits on the first space for display.
- `next.config.ts` stubs out `@react-native-async-storage/async-storage` and `pino-pretty` on the client bundle to suppress MetaMask SDK / WalletConnect build warnings.
