import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

const listeners = new Set<() => void>();
let uid: string | null = null;
let followingSnap: string[] = [];
let followersSnap: string[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function normalize(handle: string) {
  const h = handle.trim();
  return h.startsWith("@") ? h : `@${h}`;
}

async function loadFromDb() {
  if (!uid) {
    followingSnap = [];
    followersSnap = [];
    emit();
    return;
  }
  const { data } = await supabase
    .from("user_follows")
    .select("handle")
    .eq("user_id", uid);
  followingSnap = (data ?? []).map((r) => r.handle);
  // Mock: creators follow you back
  followersSnap = [...followingSnap];
  emit();
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    uid = data.session?.user.id ?? null;
    loadFromDb();
  });
  supabase.auth.onAuthStateChange((_e, s) => {
    uid = s?.user.id ?? null;
    loadFromDb();
  });
}

export async function toggleFollow(rawHandle: string) {
  if (!uid) return false;
  const handle = normalize(rawHandle);
  const isFollowing = followingSnap.includes(handle);
  if (isFollowing) {
    followingSnap = followingSnap.filter((x) => x !== handle);
    followersSnap = followersSnap.filter((x) => x !== handle);
    emit();
    await supabase.from("user_follows").delete().eq("user_id", uid).eq("handle", handle);
    return false;
  } else {
    followingSnap = [...followingSnap, handle];
    followersSnap = [...followersSnap, handle];
    emit();
    await supabase.from("user_follows").insert({ user_id: uid, handle });
    return true;
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useFollowing(): string[] {
  return useSyncExternalStore(subscribe, () => followingSnap, () => []);
}

export function useFollowers(): string[] {
  return useSyncExternalStore(subscribe, () => followersSnap, () => []);
}

export function useIsFollowing(rawHandle: string | null | undefined) {
  const list = useFollowing();
  if (!rawHandle) return false;
  return list.includes(normalize(rawHandle));
}
