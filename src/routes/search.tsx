import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import { MasonryGrid } from "@/components/MasonryGrid";
import { categories, characters, recents, trending } from "@/lib/mock-data";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · CONVAE" },
      { name: "description", content: "Search characters, creators and categories across CONVAE." },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const showResults = q.trim().length > 0;
  const results = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.creator.toLowerCase().includes(q.toLowerCase()) ||
      c.category.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="safe-top">
      <header className="sticky top-0 z-30 bg-background/85 px-4 pt-4 pb-3 backdrop-blur-xl">
        <label className="relative flex h-14 items-center rounded-[28px] bg-surface px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="ml-3 h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search characters, creators, or categories"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </label>
      </header>

      {showResults ? (
        <>
          <CategoryChips items={categories} selected={cat} onSelect={setCat} />
          {results.length ? (
            <MasonryGrid items={results} />
          ) : (
            <p className="px-4 py-12 text-center text-sm text-muted-foreground">No results for "{q}"</p>
          )}
        </>
      ) : (
        <div className="space-y-6 px-4 pb-6">
          <Section title="Recent" icon={<Clock className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2">
              {recents.map((r) => (
                <Chip key={r} label={r} onClick={() => setQ(r)} />
              ))}
            </div>
          </Section>
          <Section title="Trending" icon={<TrendingUp className="h-4 w-4" />}>
            <div className="flex flex-wrap gap-2">
              {trending.map((r) => (
                <Chip key={r} label={r} onClick={() => setQ(r)} />
              ))}
            </div>
          </Section>
          <Section title="Popular categories">
            <div className="grid grid-cols-2 gap-3">
              {categories.slice(1).map((c) => (
                <button
                  key={c}
                  onClick={() => setQ(c)}
                  className="rounded-[20px] bg-surface p-4 text-left text-sm font-semibold active:bg-surface-2"
                >
                  {c}
                </button>
              ))}
            </div>
          </Section>
          <Section title="Popular creators">
            <ul className="space-y-2">
              {["@nova", "@mythos", "@nightowl", "@kawaii"].map((u) => (
                <li
                  key={u}
                  className="flex items-center justify-between rounded-[20px] bg-surface px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full gradient-accent" />
                    <div>
                      <div className="text-sm font-semibold">{u}</div>
                      <div className="text-xs text-muted-foreground">12 characters</div>
                    </div>
                  </div>
                  <button className="rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background">
                    Follow
                  </button>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full bg-surface px-4 py-2 text-sm text-foreground active:bg-surface-2"
    >
      {label}
    </button>
  );
}
