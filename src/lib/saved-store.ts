import { useSyncExternalStore } from "react";

const KEY = "kender:saved";
const listeners = new Set<() => void>();

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

let snapshot: string[] = read();

function emit() {
  snapshot = read();
  listeners.forEach((l) => l());
}

export function toggleSaved(id: string) {
  const cur = read();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
  return next.includes(id);
}

export function useSavedIds() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => snapshot,
    () => [],
  );
}

export function useIsSaved(id: string) {
  return useSavedIds().includes(id);
}
