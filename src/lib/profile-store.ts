import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserProfile = {
  username: string;
  bio: string;
  avatar: string;
  stats: { following: number; followers: number; interactions: number };
};

const BASE = "kender.profile";

const DEFAULT_PROFILE: UserProfile = {
  username: "@you",
  bio: "",
  avatar: "",
  stats: { following: 0, followers: 0, interactions: 0 },
};

let uid: string | null = null;

function key() {
  return uid ? `${BASE}:${uid}` : `${BASE}:guest`;
}

function readFromStorage(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(key());
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...DEFAULT_PROFILE,
      ...parsed,
      stats: { ...DEFAULT_PROFILE.stats, ...(parsed.stats || {}) },
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

let snapshot: UserProfile = DEFAULT_PROFILE;
const listeners = new Set<() => void>();

function emit() {
  snapshot = readFromStorage();
  listeners.forEach((l) => l());
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
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === key()) {
      snapshot = readFromStorage();
      cb();
    }
  };
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }
  return () => {
    listeners.delete(cb);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

export function updateProfile(patch: Partial<UserProfile>) {
  const next = { ...snapshot, ...patch };
  window.localStorage.setItem(key(), JSON.stringify(next));
  emit();
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => DEFAULT_PROFILE,
  );
}
