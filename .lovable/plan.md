# Restructure & Cleanup Plan

Goal: make the app easier to change later by organizing code into clear feature folders, tightening the Supabase schema, and removing dead code — without changing any user-facing behavior.

## 1. Frontend structure

Move from a flat `src/lib` + `src/routes` layout into feature folders. Each feature owns its data hooks, stores, and UI helpers.

```text
src/
  features/
    auth/           # session, AuthGate, sign-in helpers
    characters/     # create, list, details dialog, chat-count
    chat/           # character chat, message store, regenerate logic
    dm/             # 1:1 direct messages
    profile/        # own profile, stats, owner-profile hook
    social/         # follows, blocks, reports, follow lists
    premium/        # subscription page + banner
  components/ui/    # shadcn (unchanged)
  components/common/# BottomNav, Stat, dialogs shared across features
  integrations/supabase/  # generated (untouched)
  routes/           # thin route files that import from features/*
  lib/              # only truly cross-cutting utils (format, cn, hash)
```

Route files become thin: they wire params + call feature hooks/components. All Supabase queries live in `features/<name>/api.ts` (client) or `features/<name>/*.functions.ts` (server fn).

## 2. Dead code removal

Sweep and delete:
- Unused mock JSON in `src/lib/mock-data.ts` (kept only what seeds baselines).
- Old local-only stores replaced by Supabase (`saved-store`, `liked-store` legacy paths, unused follow baseline helpers).
- Unused API routes and old image-gen providers left over from the FLUX → ModelsLab → Gemini migration.
- Unused imports, dialogs, and props flagged by `tsgo` + `knip`.

## 3. Supabase structure

Current tables are fine but inconsistent. Normalize in one migration:

- Rename `user_user_follows` → `user_follows_v2` is avoided; instead consolidate: keep **one** follows table (`user_follows`, user↔user only) and drop the legacy handle-based follow table if unused.
- Add missing indexes: `chat_messages(chat_id, created_at)`, `direct_messages(sender_id, recipient_id, created_at)`, `user_likes(character_id)`, `user_saves(character_id)`, `characters(owner_id, created_at)`.
- Add `updated_at` + trigger on `characters`, `profiles`, `chat_messages` where missing.
- Verify RLS + GRANTs on every table follow the standard block (authenticated CRUD scoped to `auth.uid()`, service_role full, anon only where needed for public reads).
- Add a `has_role` pattern only if we later need admin — not now.

## 4. Server functions

- Move all `*.functions.ts` under `src/features/<name>/` next to their consumers.
- Any file importing `client.server` becomes `*.server.ts` and is loaded via `await import()` inside handlers.
- Consolidate image generation into one `features/characters/image.functions.ts` with a single provider switch.

## 5. Verification

After each phase: run typecheck, load Home / Profile / Chat / DM / Create, confirm counts, follows, chats, and image generation still work. No behavior changes shipped.

## Rollout order

1. Supabase migration (indexes + drop unused tables/columns).
2. Move files into `features/*`, update imports, delete dead code.
3. Route files slimmed down.
4. Typecheck + manual smoke test.

## Confirm before I start

- OK to **drop** any Supabase table/column that no code references? (I'll list them before dropping.)
- Keep the current image-gen provider (Gemini) as the only one and remove FLUX/ModelsLab code paths?
