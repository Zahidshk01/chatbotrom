import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles, Share2, Pencil, ChevronRight,
  User, Heart, Bookmark, Users, Settings, HelpCircle, Shield, LogOut,
} from "lucide-react";
import { profile } from "@/lib/mock-data";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Kender" },
      { name: "description", content: "Your Kender profile, characters, and settings." },
    ],
  }),
  component: ProfilePage,
});

const sections = [
  { icon: User,     label: "My Characters" },
  { icon: Heart,    label: "Liked Characters" },
  { icon: Bookmark, label: "Saved Characters" },
  { icon: Users,    label: "Following" },
  { icon: Settings, label: "Settings" },
  { icon: HelpCircle, label: "Help" },
  { icon: Shield,   label: "Privacy Policy" },
  { icon: LogOut,   label: "Log out", danger: true },
];

function ProfilePage() {
  return (
    <div className="safe-top">
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

      <div className="mx-4 mt-5 grid grid-cols-4 rounded-[20px] bg-surface py-3 text-center">
        {[
          ["Created", profile.stats.created],
          ["Followers", profile.stats.followers],
          ["Following", profile.stats.following],
          ["Likes", profile.stats.likes],
        ].map(([k, v]) => (
          <div key={k}>
            <div className="text-base font-bold">{v}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{k}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2 px-4">
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

      <ul className="mx-4 mt-5 divide-y divide-border overflow-hidden rounded-[20px] bg-surface">
        {sections.map(({ icon: Icon, label, danger }) => (
          <li key={label}>
            <button className={`flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-surface-2 ${danger ? "text-destructive" : ""}`}>
              <span className="flex items-center gap-3 text-sm font-medium">
                <Icon className={`h-5 w-5 ${danger ? "text-destructive" : "text-muted-foreground"}`} />
                {label}
              </span>
              {!danger && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
