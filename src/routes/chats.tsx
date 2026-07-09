import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Trash2, MessageCircle, Pin } from "lucide-react";
import { chats as initialChats } from "@/lib/mock-data";


export const Route = createFileRoute("/chats")({
  head: () => ({
    meta: [
      { title: "Chats · Kender" },
      { name: "description", content: "Your conversations with AI characters." },
    ],
  }),
  component: ChatsPage,
});

function ChatsPage() {
  const [chats, setChats] = useState(initialChats);
  const empty = chats.length === 0;

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
            onClick={() => setChats([])}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {empty ? (
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
            <li key={c.id}>
              <Link
                to="/chat/$id"
                params={{ id: c.characterId }}
                className="flex w-full items-center gap-3 rounded-[20px] px-3 py-3 text-left active:bg-surface"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 truncate text-sm font-semibold">
                      {c.pinned && <Pin className="h-3 w-3 text-primary" />}
                      {c.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{c.time}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-muted-foreground">{c.last}</span>
                    {c.unread > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>

          ))}
        </ul>
      )}
    </div>
  );
}
