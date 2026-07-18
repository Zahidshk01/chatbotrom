import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MessageSquare, X } from "lucide-react";
import { useCharacters } from "@/lib/characters-cache";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · Kender" },
      { name: "description", content: "Browse and search every character on Kender." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const { items } = useCharacters();

  const results = items.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.creator ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (c.category ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (c.relation ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="safe-top">
      <header className="sticky top-0 z-30 bg-background/85 px-4 pt-4 pb-3 backdrop-blur-xl">
        <h1 className="mb-3 text-center text-xl font-bold tracking-tight">
          Ken<span className="text-primary">der</span>
        </h1>
        <label className="relative flex h-12 items-center rounded-full bg-surface px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ml-3 h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search anything..."
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </label>
      </header>

      {results.length ? (
        <div className="grid grid-cols-2 gap-1 px-1">
          {results.map((c) => (
            <Link
              key={c.id}
              to="/chat/$id"
              params={{ id: c.id }}
              className="group relative aspect-square overflow-hidden rounded-md bg-surface"
            >
              <img
                src={c.image ?? "/placeholder.png"}
                alt={c.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0" />
              <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/55 backdrop-blur-md">
                <MessageSquare className="h-3.5 w-3.5" />
              </span>
              <div className="absolute inset-x-0 bottom-0 p-2">
                <h3 className="line-clamp-1 text-sm font-semibold text-white">
                  {c.name} <span className="font-normal opacity-80">({c.relation})</span>
                </h3>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="px-4 py-12 text-center text-sm text-muted-foreground">No results for "{q}"</p>
      )}
    </div>
  );
}
