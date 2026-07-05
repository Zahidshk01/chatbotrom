import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Plus } from "lucide-react";
import { CharacterPost } from "@/components/CharacterPost";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { characters as localCharacters } from "@/lib/mock-data";

const imageById = new Map(localCharacters.map((c) => [c.id, c.image]));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kender — Discover AI Characters" },
      {
        name: "description",
        content:
          "An Instagram-style feed of AI characters. Like, share, and chat with them on Kender.",
      },
      { property: "og:title", content: "Kender — Discover AI Characters" },
      {
        property: "og:description",
        content: "An Instagram-style feed of AI characters on Kender.",
      },
    ],
  }),
  component: HomePage,
});

type Character = {
  id: string;
  name: string;
  image: string | null;
  creator: string | null;
  chats: string | null;
  category: string | null;
  height: number | null;
  tagline: string | null;
  relation: string | null;
  persona?: string | null;
  first_message?: string | null;
};

function HomePage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCharacters() {
      const { data, error } = await (supabase as any)
        .from("characters")
        .select("*")
        .order("sort_order", { ascending: true });

      console.log("SUPABASE CHARACTERS:", data);
      console.log("SUPABASE ERROR:", error);

      if (!error && data) {
        const withImages = (data as Character[]).map((c) => ({
          ...c,
          image: c.image || imageById.get(c.id) || null,
        }));
        setCharacters(withImages);
      }

      setLoading(false);
    }

    loadCharacters();
  }, []);

  const feed = characters;

  return (
    <div className="safe-top">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-bold tracking-tight">
          Ken<span className="text-primary">der</span>
        </h1>
        <div className="flex items-center gap-2">
          <Link
            to="/create"
            aria-label="Create"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </Link>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </Link>
        </div>
      </header>

      {loading ? (
        <div className="p-4 text-sm text-muted-foreground">Loading characters...</div>
      ) : characters.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          No characters found in Supabase.
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {feed.map((c, i) => (
            <CharacterPost key={`${c.id}-${i}`} char={c} />
          ))}
        </div>
      )}
    </div>
  );
}