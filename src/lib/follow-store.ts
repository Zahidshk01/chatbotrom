import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

const BASE_FOLLOWING = "kender:following";
const BASE_FOLLOWERS = "kender:followers";

let uid: string | null = null;
const listeners = new Set<() => void>();

function kFollowing() {
  return uid ? `${BASE_FOLLOWING}:${uid}` : `${BASE_FOLLOWING}:guest`;
}
function kFollowers() {
  return uid ? `${BASE_FOLLOWERS}:${uid}` : `${BASE_FOLLOWERS}:guest`;
}

function readList(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

let followingSnap: string[] = [];
let followersSnap: string[] = [];

function emit() {
  followingSnap = readList(kFollowing());
  followersSnap = readList(kFollowers());
  listeners.forEach((l) => l());
}

function normalize(handle: string) {
  const h = handle.trim();
  return h.startsWith("@") ? h : `@${h}`;
}

if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    uid = data.session?.user.id ?? null;
    emit();
  });
  supabase.auth.onAuthStateChange((_e, s) => {
    uid = s?.user.id ?? null;
    emit();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === kFollowing() || e.key === kFollowers()) emit();
  });
}

export function toggleFollow(rawHandle: string) {
  const handle = normalize(rawHandle);
  const cur = readList(kFollowing());
  const next = cur.includes(handle)
    ? cur.filter((x) => x !== handle)
    : [...cur, handle];
  localStorage.setItem(kFollowing(), JSON.stringify(next));

  // Mock: creators "follow you back" when you follow them
  const followers = readList(kFollowers());
  if (next.includes(handle) && !followers.includes(handle)) {
    localStorage.setItem(
      kFollowers(),
      JSON.stringify([...followers, handle]),
    );
  } else if (!next.includes(handle) && followers.includes(handle)) {
    localStorage.setItem(
      kFollowers(),
      JSON.stringify(followers.filter((x) => x !== handle)),
    );
  }

  emit();
  return next.includes(handle);
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
