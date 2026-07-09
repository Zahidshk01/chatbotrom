import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search, Trash2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { characters as localCharacters } from "@/lib/mock-data";
import { resolveImage } from "@/lib/character-images";

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
  image: string;
  last: string;
  time: string;
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function ChatsPage() {
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      setChats([]);
      setLoading(false);
      return;
    }
    const { data: msgs } = await (supabase as any)
      .from("chat_messages")
      .select("character_id, content, created_at, role")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    if (!msgs) {
      setChats([]);
      setLoading(false);
      return;
    }
    const byChar = new Map<string, { last: string; created_at: string }>();
    for (const m of msgs) {
      if (!byChar.has(m.character_id))
        byChar.set(m.character_id, { last: m.content, created_at: m.created_at });
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
    (chars ?? []).forEach((c: any) => charMap.set(c.id, { name: c.name, image: c.image }));
    // fallback to local mock characters
    localCharacters.forEach((c) => {
      if (!charMap.has(c.id)) charMap.set(c.id, { name: c.name, image: c.image });
    });

    const rows: ChatRow[] = ids.map((id) => {
      const info = byChar.get(id)!;
      const c = charMap.get(id);
      return {
        characterId: id,
        name: c?.name ?? "Unknown",
        image: resolveImage(id, c?.image),
        last: info.last,
        time: timeAgo(info.created_at),
      };
    });
    setChats(rows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const clearAll = async () => {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) return;
    await (supabase as any).from("chat_messages").delete().eq("user_id", uid);
    setChats([]);
  };

  const empty = !loading && chats.length === 0;

  return (
    <div className="safe-top">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Chats</h1>
        <div className="flex items-center gap-2">
          <button aria-label="Search chats" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface">
            <Search className="h-5 w-5" />
          </button>
          <button
            aria-label="Delete all"
            onClick={clearAll}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="px-6 pt-16 text-center text-sm text-muted-foreground">Loading…</div>
      ) : empty ? (
        <div className="flex flex-col items-center justify-center px-6 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface">
            <MessageCircle className="h-9 w-9 text-muted-foreground" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">No conversations yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Find a character that catches your eye.</p>
          <Link to="/" className="mt-6 rounded-full gradient-accent px-6 py-3 text-sm font-semibold text-primary-foreground shadow-accent">
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
                <img src={c.image} alt={c.name} loading="lazy" className="h-14 w-14 shrink-0 rounded-full object-cover" />
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
