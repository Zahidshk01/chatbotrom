import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { Character } from "@/lib/mock-data";

export function CharacterPost({ char }: { char: Character }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [likes, setLikes] = useState(() => 1000 + Math.floor(Math.random() * 90000));

  const toggleLike = () => {
    setLiked((v) => {
      setLikes((n) => n + (v ? -1 : 1));
      return !v;
    });
  };

  const share = async () => {
    const url = `${window.location.origin}/chat/${char.id}`;
    const data = { title: char.name, text: `Chat with ${char.name} on Kender`, url };
    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  };

  const openChat = () => navigate({ to: "/chat/$id", params: { id: char.id } });

  return (
    <article className="animate-pop-in">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5">
        <Link
          to="/chat/$id"
          params={{ id: char.id }}
          className="relative h-9 w-9 shrink-0 rounded-full p-[2px] gradient-accent"
        >
          <img src={char.image} alt={char.name} className="h-full w-full rounded-full border-2 border-background object-cover" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-sm font-semibold leading-tight">
            <span className="truncate">{char.name}</span>
            <span className="text-primary">·</span>
            <span className="text-[11px] font-medium text-primary">AI</span>
          </div>
          <div className="truncate text-[11px] text-muted-foreground">{char.creator} · {char.category}</div>
        </div>
        <button aria-label="More" className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground active:scale-95">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      {/* Image */}
      <button
        onDoubleClick={toggleLike}
        onClick={openChat}
        className="relative block w-full overflow-hidden bg-surface"
        aria-label={`Open chat with ${char.name}`}
      >
        <img src={char.image} alt={char.name} className="aspect-[4/5] w-full object-cover" loading="lazy" />
        <span className="absolute left-3 top-3 rounded-full bg-background/55 px-2 py-1 text-[10px] font-semibold backdrop-blur-md">
          {char.chats} chats
        </span>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 pt-2">
        <button
          onClick={toggleLike}
          aria-label="Like"
          className="flex h-10 w-10 items-center justify-center rounded-full active:scale-90 transition-transform"
        >
          <Heart className={`h-6 w-6 transition-colors ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
        <button
          onClick={openChat}
          aria-label="Comment / chat"
          className="flex h-10 w-10 items-center justify-center rounded-full active:scale-90"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
        <button
          onClick={share}
          aria-label="Share"
          className="flex h-10 w-10 items-center justify-center rounded-full active:scale-90"
        >
          <Send className="h-6 w-6" />
        </button>
        <div className="ml-auto">
          <button
            onClick={() => setSaved((s) => !s)}
            aria-label="Save"
            className="flex h-10 w-10 items-center justify-center rounded-full active:scale-90"
          >
            <Bookmark className={`h-6 w-6 ${saved ? "fill-foreground" : ""}`} />
          </button>
        </div>
      </div>

      {/* Meta */}
      <div className="px-4 pb-4">
        <div className="text-sm font-semibold">{likes.toLocaleString()} likes</div>
        <p className="mt-1 text-sm leading-snug">
          <span className="font-semibold">{char.name}</span>{" "}
          <span className="text-foreground/90">{char.tagline}</span>
        </p>
        <button
          onClick={openChat}
          className="mt-1 text-xs text-muted-foreground active:opacity-70"
        >
          Tap comment to chat with {char.name.split(" ")[0]}…
        </button>
      </div>
    </article>
  );
}
