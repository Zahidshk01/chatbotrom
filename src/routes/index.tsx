import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Search, Sparkles } from "lucide-react";
import { CategoryChips } from "@/components/CategoryChips";
import { MasonryGrid } from "@/components/MasonryGrid";
import { categories, characters } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CONVAE — Discover AI Characters" },
      { name: "description", content: "Chat with thousands of AI characters. Discover romance, anime, fantasy, gaming companions and more on CONVAE." },
      { property: "og:title", content: "CONVAE — Discover AI Characters" },
      { property: "og:description", content: "Chat with thousands of AI characters on CONVAE." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [cat, setCat] = useState("All");
  const filtered = cat === "All" ? characters : characters.filter((c) => c.category === cat);
  // duplicate to give the feed some length
  const feed = [...filtered, ...filtered];

  return (
    <div className="safe-top">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="w-10" />
        <h1 className="text-lg font-bold tracking-tight">
          CONV<span className="text-primary">AE</span>
        </h1>
        <button
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
        </button>
      </header>

      <div className="px-4 pt-2">
        <label className="relative flex h-14 items-center rounded-[28px] bg-surface px-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            className="ml-3 h-full flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search characters, creators, or categories"
          />
        </label>
      </div>

      <CategoryChips items={categories} selected={cat} onSelect={setCat} />

      <MasonryGrid items={feed} />

      <div className="px-4 pt-2">
        <div className="sticky bottom-24 flex items-center justify-between gap-3 rounded-[20px] gradient-accent p-4 shadow-accent">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
            <div className="text-primary-foreground">
              <div className="text-sm font-semibold">Go Premium</div>
              <div className="text-xs opacity-80">Unlimited chats · faster replies</div>
            </div>
          </div>
          <button className="rounded-full bg-background/20 px-4 py-2 text-xs font-semibold text-primary-foreground backdrop-blur">
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
