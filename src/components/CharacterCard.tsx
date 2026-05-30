import { MessageSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Character } from "@/lib/mock-data";

export function CharacterCard({ char }: { char: Character }) {
  return (
    <Link
      to="/chat/$id"
      params={{ id: char.id }}
      className="group relative mb-3 block overflow-hidden rounded-[20px] bg-surface animate-pop-in"
      style={{ height: char.height * 4 }}
    >
      <img
        src={char.image}
        alt={char.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-active:scale-[1.03]"
      />
      <div className="absolute inset-0 gradient-overlay" />

      <span
        aria-hidden
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/55 text-foreground backdrop-blur-md"
      >
        <MessageSquare className="h-4 w-4" />
      </span>

      <div className="absolute inset-x-0 bottom-0 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-foreground">{char.name}</h3>
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="line-clamp-1">{char.creator}</span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {char.chats}
          </span>
        </div>
      </div>
    </Link>
  );
}
