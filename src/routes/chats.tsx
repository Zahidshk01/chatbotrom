import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { characters as mockCharacters } from "@/lib/mock-data";

export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "Chats · Kender" },
      { name: "description", content: "Your conversations with AI characters." },
    ],
  }),
  component: ChatsPage,
});

type ChatRow = {
  characterId: string;
  name: string;
  image: string | null;
  last: string;
  time: string;
};

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ChatsPage() {
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);

  async function load() {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) {
      setSignedIn(false);
      setChats([]);
      setLoading(false);
      return;
    }
    setSignedIn(true);

    const { data: rows } = await (supabase as any)
      .from("chat_messages")
      .select("character_id, content, created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    const byChar = new Map<string, { last: string; time: string }>();
    for (const r of (rows ?? []) as Array<{ character_id: string; content: string; created_at: string }>) {
      if (!byChar.has(r.character_id)) {
        byChar.set(r.character_id, { last: r.content, time: formatTime(r.created_at) });
      }
    }

    const ids = Array.from(byChar.keys());
    if (ids.length === 0) {
      setChats([]);
      setLoading(false);
      return;
    }

    const { data: chars } = await (supabase as any)
      .from("characters")
      .select("id, name, image")
      .in("id", ids);

    const charMap = new Map<string, { name: string; image: string | null }>();
    for (const c of (chars ?? []) as Array<{ id: string; name: string; image: string | null }>) {
      charMap.set(c.id, { name: c.name, image: c.image });
    }
    // fallback to local assets for seeded chars
    for (const m of mockCharacters) {
      const existing = charMap.get(m.id);
      if (existing && !existing.image) existing.image = m.image;
      if (!existing) charMap.set(m.id, { name: m.name, image: m.image });
    }

    const list: ChatRow[] = ids.map((cid) => {
      const meta = byChar.get(cid)!;
      const info = charMap.get(cid) ?? { name: "Unknown", image: null };
      return { characterId: cid, name: info.name, image: info.image, last: meta.last, time: meta.time };
    });

    setChats(list);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteAll() {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id;
    if (!uid) return;
    await (supabase as any).from("chat_messages").delete().eq("user_id", uid);
    setChats([]);
  }

  const empty = !loading && chats.length === 0;

  return (
    <div className="safe-top">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
        <div className="flex items-center gap-2">
          <button
            aria-label="Search chats"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            aria-label="Delete all"
            onClick={deleteAll}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">Loading…</p>
      ) : !signedIn ? (
        <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <MessageCircle className="h-9 w-9 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Sign in to see your chats</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your conversations are saved to your account.</p>
          <Link
            to="/auth"
            className="mt-6 rounded-full gradient-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-accent"
          >
            Sign in
          </Link>
        </div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <MessageCircle className="h-9 w-9 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No conversations yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find a character that catches your eye.</p>
          <Link
            to="/"
            className="mt-6 rounded-full gradient-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-accent"
          >
            Discover Characters
          </Link>
        </div>
      ) : (
        <ul className="px-2">
          {chats.map((c) => (
            <li key={c.characterId}>
              <Link
                to="/chat/$id"
                params={{ id: c.characterId }}
                className="flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left active:bg-surface"
              >
                {c.image ? (
                  <img
                    src={c.image}
                    alt={c.name}
                    loading="lazy"
                    className="h-14 w-14 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-full bg-surface" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.name}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{c.time}</span>
                  </div>
                  <div className="mt-0.5 truncate text-sm text-muted-foreground">{c.last}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
