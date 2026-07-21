import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Kender" },
      { name: "description", content: "Character reminders on Kender." },
    ],
  }),
  component: NotificationsPage,
});

type Character = {
  id: string;
  name: string;
  image: string;
  tagline: string | null;
};

type Reminder = {
  id: string;
  character: Character;
  message: string;
  time: string;
  lastAt: number;
};

const NUDGES = [
  (n: string) => `${n} is thinking about you… come say hi 💭`,
  (n: string) => `${n} wants to continue your conversation`,
  (n: string) => `${n} misses you — pick up where you left off`,
  (n: string) => `${n} left something unsaid… tap to reply`,
  (n: string) => `${n} is waiting for your next message`,
  (n: string) => `${n} has something to tell you`,
];

function nudgeFor(id: string, name: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return NUDGES[Math.abs(h) % NUDGES.length](name);
}

function timeAgo(ts: number) {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function NotificationsPage() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) {
        if (!cancelled) { setItems([]); setLoading(false); }
        return;
      }

      // Characters the user has chatted with — reminders come from these
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("character_id, created_at")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(200);

      const lastByChar = new Map<string, number>();
      (msgs ?? []).forEach((m: any) => {
        if (!lastByChar.has(m.character_id)) {
          lastByChar.set(m.character_id, new Date(m.created_at).getTime());
        }
      });

      const ids = Array.from(lastByChar.keys());
      if (ids.length === 0) {
        if (!cancelled) { setItems([]); setLoading(false); }
        return;
      }

      const { data: chars } = await supabase
        .from("characters")
        .select("id, name, image, tagline")
        .in("id", ids);

      const reminders: Reminder[] = (chars ?? []).map((c: any) => {
        const lastAt = lastByChar.get(c.id) ?? Date.now();
        return {
          id: c.id,
          character: c,
          message: nudgeFor(c.id, c.name),
          time: timeAgo(lastAt),
          lastAt,
        };
      }).sort((a, b) => b.lastAt - a.lastAt);

      if (!cancelled) { setItems(reminders); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="safe-top">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/80 px-2 py-3 backdrop-blur-xl">
        <Link to="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full active:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">Notifications</h1>
      </header>

      {loading ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-20 text-center">
          <MessageCircle className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-semibold">No reminders yet</p>
          <p className="text-xs text-muted-foreground">Start chatting with a character and they'll reach out to you here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {items.map((n) => (
            <li key={n.id}>
              <Link to="/chat/$id" params={{ id: n.character.id }} className="flex items-center gap-3 px-4 py-3 active:bg-surface">
                <div className="relative shrink-0">
                  <img src={n.character.image} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <MessageCircle className="h-3 w-3" />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{n.character.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
