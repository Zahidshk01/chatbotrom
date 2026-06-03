import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Sparkles, Share2, Pencil, ChevronDown, Bookmark,
  User, Heart, Users, Settings, HelpCircle, Shield, LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { profile, characters, type Character } from "@/lib/mock-data";
import { useSavedIds } from "@/lib/saved-store";
import { useLikedIds } from "@/lib/liked-store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Kender" },
      { name: "description", content: "Your Kender profile, characters, and settings." },
    ],
  }),
  component: ProfilePage,
});

function CharGrid({ items, empty }: { items: Character[]; empty: string }) {
  const navigate = useNavigate();
  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-surface-2 px-4 py-6 text-center text-sm text-muted-foreground">
        {empty}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate({ to: "/chat/$id", params: { id: c.id } })}
          className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-surface-2 active:scale-95"
        >
          <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
            <p className="truncate text-xs font-semibold text-white">{c.name}</p>
            <p className="truncate text-[10px] text-white/70">({c.relation})</p>
          </div>
        </button>
      ))}
    </div>
  );
}

type SectionProps = {
  icon: LucideIcon;
  label: string;
  count?: number | string;
  defaultOpen?: boolean;
  danger?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
};

function Section({ icon: Icon, label, count, defaultOpen, danger, onClick, children }: SectionProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const isCollapsible = !!children;

  return (
    <div className="overflow-hidden rounded-[20px] bg-surface">
      <button
        onClick={() => (isCollapsible ? setOpen((v) => !v) : onClick?.())}
        className={`flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-surface-2 ${danger ? "text-destructive" : ""}`}
      >
        <span className="flex items-center gap-3 text-sm font-semibold">
          <Icon className={`h-5 w-5 ${danger ? "text-destructive" : "text-muted-foreground"}`} />
          {label}
          {count !== undefined && (
            <span className="text-xs font-normal text-muted-foreground">({count})</span>
          )}
        </span>
        {isCollapsible && (
          <ChevronDown
            className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {isCollapsible && open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ProfilePage() {
  const savedIds = useSavedIds();
  const likedIds = useLikedIds();
  const savedChars = characters.filter((c) => savedIds.includes(c.id));
  const likedChars = characters.filter((c) => likedIds.includes(c.id));
  const myChars: Character[] = []; // user-created characters (none yet)

  return (
    <div className="safe-top pb-8">
      <div className="flex flex-col items-center px-4 pt-6 text-center">
        <img
          src={profile.avatar}
          alt={profile.name}
          className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
        />
        <h1 className="mt-3 text-xl font-bold">{profile.name}</h1>
        <p className="text-sm text-muted-foreground">{profile.username}</p>
        <p className="mt-2 max-w-xs text-balance text-sm text-foreground/80">{profile.bio}</p>
      </div>

      <div className="mt-5 flex gap-2 px-4">
        <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-sm font-semibold active:bg-surface-2">
          <Pencil className="h-4 w-4" /> Edit Profile
        </button>
        <button className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-surface text-sm font-semibold active:bg-surface-2">
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>

      <div className="mx-4 mt-5 overflow-hidden rounded-[24px] gradient-accent p-5 shadow-accent">
        <div className="flex items-center gap-2 text-primary-foreground">
          <Sparkles className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-wide">Premium</span>
        </div>
        <h2 className="mt-2 text-xl font-bold text-primary-foreground">Upgrade to Premium</h2>
        <ul className="mt-3 space-y-1 text-sm text-primary-foreground/90">
          <li>· Unlimited chats</li>
          <li>· Priority responses</li>
          <li>· Advanced character creation</li>
          <li>· No ads</li>
        </ul>
        <button className="mt-4 w-full rounded-full bg-background/15 py-3 text-sm font-semibold text-primary-foreground backdrop-blur">
          Upgrade
        </button>
      </div>

      <div className="mx-4 mt-5 space-y-2">
        <Section icon={User} label="My Characters" count={myChars.length} defaultOpen>
          <CharGrid items={myChars} empty="You haven't created any characters yet." />
        </Section>

        <Section icon={Bookmark} label="Saved Characters" count={savedChars.length}>
          <CharGrid
            items={savedChars}
            empty="No saved characters yet. Tap the bookmark icon on any post to save them here."
          />
        </Section>

        <Section icon={Heart} label="Liked Characters" count={likedChars.length}>
          <CharGrid
            items={likedChars}
            empty="No liked characters yet. Tap the heart on any post to like them."
          />
        </Section>

        <Section icon={Users} label="Following" count={profile.stats.following}>
          <div className="grid grid-cols-2 gap-2 text-center">
            {[
              ["Created", profile.stats.created],
              ["Followers", profile.stats.followers],
              ["Following", profile.stats.following],
              ["Saved", savedChars.length],
            ].map(([k, v]) => (
              <div key={k as string} className="rounded-xl bg-surface-2 py-3">
                <div className="text-base font-bold">{v}</div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section icon={Settings} label="Settings">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Account, notifications, appearance, and privacy preferences.</p>
            <button className="w-full rounded-xl bg-surface-2 py-2.5 text-foreground active:scale-[0.99]">Manage settings</button>
          </div>
        </Section>

        <Section icon={HelpCircle} label="Help">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Need a hand? Browse the FAQ or contact support.</p>
            <button className="w-full rounded-xl bg-surface-2 py-2.5 text-foreground active:scale-[0.99]">Contact support</button>
          </div>
        </Section>

        <Section icon={Shield} label="Privacy Policy">
          <p className="text-sm leading-relaxed text-muted-foreground">
            We respect your privacy. Your chats and characters stay yours. Read the full policy for
            details on data collection, storage, and your rights.
          </p>
        </Section>

        <Section icon={LogOut} label="Log out" danger onClick={() => {}} />
      </div>
    </div>
  );
}
