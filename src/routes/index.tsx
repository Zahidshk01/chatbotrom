import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Plus } from "lucide-react";
import { CharacterPost } from "@/components/CharacterPost";
import { characters } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kender — Discover AI Characters" },
      { name: "description", content: "An Instagram-style feed of AI characters. Like, share, and chat with them on Kender." },
      { property: "og:title", content: "Kender — Discover AI Characters" },
      { property: "og:description", content: "An Instagram-style feed of AI characters on Kender." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const feed = [...characters, ...characters];

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

      <div className="divide-y divide-border/60">
        {feed.map((c, i) => (
          <CharacterPost key={`${c.id}-${i}`} char={c} />
        ))}
      </div>
    </div>
  );
}
