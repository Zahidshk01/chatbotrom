# Kender — Project Structure

Quick map so front-end and back-end edits stay easy to find.

## Routes (`src/routes/`)
File-based (TanStack Router). Filename → URL.

| File | URL | Purpose |
| --- | --- | --- |
| `__root.tsx` | — | Root shell: Auth gate, providers, bottom nav |
| `index.tsx` | `/` | Home feed |
| `search.tsx` | `/search` | Discover grid |
| `create.tsx` | `/create` | Create-character flow |
| `chats.tsx` | `/chats` | Conversations list |
| `chat.$id.tsx` | `/chat/:id` | Character chat (realtime, Supabase) |
| `dm.$userId.tsx` | `/dm/:userId` | Direct message with another user |
| `u.$userId.tsx` | `/u/:userId` | Public user profile (block/report menu) |
| `profile.tsx` | `/profile` | My profile (tabs: characters, liked, saved) |
| `settings.tsx` | `/settings` | Account/legal/blocked users/sign out |
| `premium.tsx` | `/premium` | Kender Pro subscription |
| `notifications.tsx` | `/notifications` | Activity feed |
| `auth.tsx` | `/auth` | Sign in |
| `api/*.ts` | `/api/*` | Server routes (chat, image gen, first-message gen) |

## Components (`src/components/`)
Presentational + shared:
- `BottomNav.tsx` – fixed nav; hidden on chat/dm/settings/premium/auth
- `CharacterPost.tsx` – home feed card (like/save/share/chat)
- `CharacterCard.tsx`, `MasonryGrid.tsx`, `CategoryChips.tsx` – search UI
- `ui/*` – shadcn primitives (do not edit manually)

## Client state stores (`src/lib/*-store.ts`)
Each store owns one domain, is user-id namespaced, and syncs with Supabase.
- `profile-store.ts` – current user's profile (username/avatar/bio)
- `follow-store.ts` – handle-based follows (characters/creators)
- `user-follow.ts` – user↔user follow counts
- `liked-store.ts` / `saved-store.ts` – character interactions
- `block-store.ts` – blocked users + reports
- `owner-profile.ts` – cache of other users' public profiles

## Data helpers (`src/lib/`)
- `mock-data.ts` – seeded character list (used as fallback / lookup)
- `character.ts` – character type/utilities
- `character-images.ts` – image asset map
- `creator-meta.ts` – handle → avatar/bio (synthetic creators)
- `follow-baseline.ts` – deterministic inflated follower counts

## Server (`src/routes/api/`)
All AI/keys stay server-side. Every AI endpoint requires a Supabase bearer.
- `chat.ts` – character chat completion
- `generate-character-image.ts` – ModelsLab Anything V5 (NSFW allowed, anime forced)
- `generate-first-message.ts` – first-message generator

## Supabase tables
`characters`, `chat_messages`, `direct_messages`, `profiles`,
`user_likes`, `user_saves`, `user_follows` (handle-scoped),
`user_user_follows` (user↔user), `user_blocks`, `user_reports`.

## Editing tips
- Change a screen → edit its route file.
- Change persistence for a domain → edit the matching `*-store.ts`.
- Change AI behavior/keys → edit `src/routes/api/*` only.
- Never hardcode API keys in `src/`; use secrets (available as `process.env.*` in server routes).
