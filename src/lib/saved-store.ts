import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

const BASE = "kender:saved";
const listeners = new Set<() => void>();
let uid: string | null = null;

function key() {
  return uid ? `${BASE}:${uid}` : `${BASE}:guest`;
}

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key()) || "[]");
  } catch {
    return [];
  }
}

let snapshot: string[] = [];

function emit() {
  snapshot = read();
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

export function toggleSaved(id: string) {
  const cur = read();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
  localStorage.setItem(key(), JSON.stringify(next));
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
