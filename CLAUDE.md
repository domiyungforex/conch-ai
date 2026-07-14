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

**Auth** (`@clerk/nextjs`):
- Clerk handles all authentication — sign-in/sign-up pages, session cookies, and `auth()` in every API route (server-side `{ userId }` is the Clerk user ID, used directly as the id for the corresponding Appwrite documents).
- `src/middleware.ts` uses `clerkMiddleware`/`createRouteMatcher` to protect routes.
- Appwrite's `Users` service is never used — Appwrite is data storage only.

**Database** (`src/lib/db.ts`, `src/lib/appwrite.ts`):
- Appwrite Databases (NoSQL) is the sole datastore — memories, conversations, messages, agents, reputations, wallets, shared contexts, API keys. `COLLECTIONS` constants and TypeScript doc types are in `src/lib/db.ts`.
- Clerk's `userId` is used directly as the `userId` field on every document (no separate `users` collection join needed for auth purposes).
- Documents are returned as `AppwriteDoc<T>` which has `$id`, `$createdAt`, `$updatedAt` (strings) plus all domain fields.
- No atomic increment: fetch-then-update for reputation counters.
- Setup: run `npx tsx scripts/setup-appwrite-db.ts` once after adding `APPWRITE_DATABASE_ID` to `.env`.

**Memory pipeline** (`src/lib/memory.ts`, `src/lib/vectorSearch.ts`):
- Memories are stored entirely in Appwrite — the `embedding` float-array attribute holds the vector alongside the rest of the document, no separate vector service.
- `retrieveRelevantMemories(userId, query, topK, category, minScore=0.65)` fetches the user's candidate memories from Appwrite (bounded scan, see `MAX_CANDIDATES`) and ranks them in-process via `topKBySimilarity` (cosine similarity) in `src/lib/vectorSearch.ts`. Brute-force by design — fine at personal/small-team scale.
- `buildSystemPrompt(agentSystemPrompt, memories)` — assembles the final system prompt for chat.

**AI chat** (`src/app/api/chat/route.ts`):
- Uses Vercel AI SDK `streamText` with `@ai-sdk/anthropic` (Claude). Response is a data stream with an `X-Conversation-Id` header injected for client-side URL routing.
- Client hook `useChat` (`src/hooks/useChat.ts`) reads that header to update the URL on new conversations.
- Embeddings (`src/lib/embeddings.ts`) come from Voyage AI (`voyage-3.5`) via direct REST call — Anthropic has no embeddings endpoint.

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
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | Clerk auth |
| `ANTHROPIC_API_KEY` | Claude for chat (`claude-sonnet-5` default) |
| `VOYAGE_API_KEY` | Voyage AI embeddings (`voyage-3.5`, 1024 dims) for memory vectors |

## Notable constraints

- `node-appwrite` (server SDK) requires Node.js runtime — cannot run in the Edge runtime. Keep middleware lightweight (cookie check only).
- Appwrite's user model has a single `name` string field — no `firstName`/`lastName`. The profile page splits on the first space for display.
- `next.config.ts` stubs out `@react-native-async-storage/async-storage` and `pino-pretty` on the client bundle to suppress MetaMask SDK / WalletConnect build warnings.
