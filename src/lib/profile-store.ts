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

function read(): UserProfile {
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

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function updateProfile(patch: Partial<UserProfile>) {
  const next = { ...read(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useProfile(): UserProfile {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_PROFILE);
}
