import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/character-images";
import type { Character } from "@/lib/character";

const PUBLIC_CACHE_KEY = "kender.public-characters.v1";

function readPublicCache(): Character[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(PUBLIC_CACHE_KEY) ?? "[]");
    return Array.isArray(value) ? (value as Character[]) : [];
  } catch {
    return [];
  }
}

function writePublicCache(characters: Character[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PUBLIC_CACHE_KEY, JSON.stringify(characters));
  } catch {
    /* Keep the network result when browser storage is unavailable. */
  }
}

/**
 * One shared, cached characters query for the whole app.
 * Home / Search / Chats reuse the same cache entry, so switching tabs is
 * instant instead of re-hitting the network on every mount.
 */
async function fetchCharacters(publicOnly: boolean): Promise<Character[]> {
  const runQuery = async () => {
    let query = (supabase as any)
      .from("characters")
      .select(
        "id, name, image, creator, chats, category, height, tagline, relation, persona, first_message, owner_id, visibility, sort_order",
      )
      .order("sort_order", { ascending: true });

    if (publicOnly) query = query.eq("visibility", "public");
    return query;
  };

  let result = await runQuery();
  if (result.error) {
    // Let the auth SDK finish restoring an idle session, then retry once with
    // the fresh access token instead of caching an authorization failure.
    await supabase.auth.getSession();
    result = await runQuery();
  }

  if (result.error) {
    const cached = publicOnly ? readPublicCache() : [];
    if (cached.length > 0) return cached;
    throw result.error;
  }

  const characters = ((result.data ?? []) as Character[]).map((c) => ({
    ...c,
    image: resolveImage(c.id, c.image),
  }));

  if (publicOnly && characters.length > 0) writePublicCache(characters);
  return characters;
}

export const charactersQuery = (publicOnly = false) =>
  queryOptions({
    queryKey: ["characters", publicOnly ? "public" : "all"] as const,
    queryFn: () => fetchCharacters(publicOnly),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
  });
