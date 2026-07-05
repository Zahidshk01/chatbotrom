import { useSyncExternalStore } from "react";

export type UserProfile = {
  username: string;
  bio: string;
  avatar: string; // data URL or remote URL
  stats: { following: number; followers: number; interactions: number };
};

const KEY = "kender.profile";

const DEFAULT_PROFILE: UserProfile = {
  username: "@ZahidShk05",
  bio: "Just livin as usual",
  avatar: "",
  stats: { following: 85, followers: 174, interactions: 4 },
};

function readFromStorage(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(KEY);
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

// Cached snapshot — required for useSyncExternalStore to avoid infinite
// re-renders (each call must return a referentially-stable value).
let snapshot: UserProfile = readFromStorage();

const listeners = new Set<() => void>();

function emit() {
  snapshot = readFromStorage();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
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
  window.localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => DEFAULT_PROFILE,
  );
}
