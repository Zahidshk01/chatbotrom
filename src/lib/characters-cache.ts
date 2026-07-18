import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveImage } from "@/lib/character-images";
import type { Character } from "@/lib/character";

// Module-level cache — persists across route mounts so navigation is instant.
let cache: Character[] | null = null;
let inflight: Promise<Character[]> | null = null;
const listeners = new Set<(c: Character[]) => void>();

function notify(next: Character[]) {
  cache = next;
  listeners.forEach((l) => l(next));
}

async function fetchAll(): Promise<Character[]> {
  const { data } = await (supabase as any)
    .from("characters")
    .select("*")
    .order("sort_order", { ascending: true });
  let rows = ((data ?? []) as Character[]).map((c) => ({
    ...c,
    image: resolveImage(c.id, c.image),
  }));

  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[];
  if (ownerIds.length > 0) {
    const { data: profiles } = await (supabase as any)
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ownerIds);
    const map = new Map<string, { username: string | null; avatar_url: string | null }>();
    (profiles ?? []).forEach((p: any) => map.set(p.id, { username: p.username, avatar_url: p.avatar_url }));
    rows = rows.map((r) => {
      if (!r.owner_id) return r;
      const p = map.get(r.owner_id);
      if (!p) return r;
      const handle = p.username
        ? (p.username.startsWith("@") ? p.username : `@${p.username.split(" ")[0].toLowerCase()}`)
        : r.creator;
      return { ...r, creator: handle, creatorAvatar: p.avatar_url };
    });
  }

  notify(rows);
  return rows;
}

export function primeCharacters(): Promise<Character[]> {
  if (inflight) return inflight;
  inflight = fetchAll().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function invalidateCharacters() {
  cache = null;
  primeCharacters();
}

export function useCharacters() {
  const [items, setItems] = useState<Character[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    const l = (next: Character[]) => {
      setItems(next);
      setLoading(false);
    };
    listeners.add(l);
    if (cache) {
      setItems(cache);
      setLoading(false);
    }
    // Always kick a background refresh (SWR).
    primeCharacters().catch(() => setLoading(false));
    return () => {
      listeners.delete(l);
    };
  }, []);

  return { items, loading };
}

export function getCharacterFromCache(id: string): Character | null {
  return cache?.find((c) => c.id === id) ?? null;
}
