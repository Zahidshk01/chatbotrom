import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Bookmark, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { Character } from "@/lib/mock-data";

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export function CharacterPost({ char }: { char: Character }) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [likes, setLikes] = useState(() => 5000 + Math.floor(Math.random() * 40000));
  const comments = 1000 + Math.floor(Math.random() * 150000);

  const toggleLike = () => {
    setLiked((v) => {
      setLikes((n) => n + (v ? -1 : 1));
      return !v;
    });
  };

  const toggleSave = () => {
    setSaved((s) => {
      toast.success(s ? "Removed from your profile" : "Saved to your profile");
      return !s;
    });
  };

  const toggleFollow = () => {
    setFollowing((f) => {
      toast.success(f ? `Unfollowed ${char.creator}` : `Following ${char.creator}`);
      return !f;
    });
  };

  const openChat = () => navigate({ to: "/chat/$id", params: { id: char.id } });

  // Creator initial for the avatar circle (matches reference)
  const creatorLabel = char.creator.replace(/^@/, "");
  const creatorInitial = creatorLabel.charAt(0).toUpperCase();

  return (
    <article className="animate-pop-in pb-4">
      {/* Creator row (above image, like the reference) */}
      <header className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-foreground">
            {creatorInitial}
          </div>
          <span className="truncate text-sm font-semibold">{creatorLabel}</span>
        </div>
        <button
          onClick={toggleFollow}
          className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
            following
              ? "border-border bg-surface text-muted-foreground"
              : "border-border bg-transparent text-foreground active:scale-95"
          }`}
        >
          {following ? "Following" : "Follow"}
        </button>
      </header>

      {/* Image */}
      <button
        onDoubleClick={toggleLike}
        onClick={openChat}
        className="relative block w-full overflow-hidden bg-surface"
        aria-label={`Chat with ${char.name}`}
      >
        <img src={char.image} alt={char.name} className="aspect-[4/5] w-full object-cover" loading="lazy" />
        {/* Floating chat bubble like reference */}
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md bg-background/70 backdrop-blur-md">
          <MessageCircle className="h-5 w-5 fill-foreground text-foreground" />
        </span>
      </button>

      {/* Counts row (under image, like reference) */}
      <div className="flex items-center gap-5 px-4 pt-3">
        <button onClick={toggleLike} className="flex items-center gap-2 active:scale-95">
          <Heart className={`h-6 w-6 transition-colors ${liked ? "fill-primary text-primary" : "text-foreground"}`} />
          <span className="text-sm font-semibold">{fmt(likes)}</span>
        </button>
        <button onClick={openChat} className="flex items-center gap-2 active:scale-95">
          <MessageCircle className="h-6 w-6" />
          <span className="text-sm font-semibold">{fmt(comments)}</span>
        </button>
        <button
          onClick={toggleSave}
          aria-label="Save"
          className="ml-auto flex h-9 w-9 items-center justify-center active:scale-95"
        >
          <Bookmark className={`h-6 w-6 ${saved ? "fill-primary text-primary" : "text-foreground"}`} />
        </button>
        <button aria-label="More" className="flex h-9 w-9 items-center justify-center text-muted-foreground active:scale-95">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Name + relation + tagline */}
      <div className="px-4 pt-1.5">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{char.name}</span>
          <span className="text-muted-foreground"> ({char.relation})</span>
          <span className="text-foreground/90">  {char.tagline} </span>
          <button onClick={openChat} className="text-muted-foreground active:opacity-70">…more</button>
        </p>
      </div>
    </article>
  );
}
