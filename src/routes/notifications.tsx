import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, MessageCircle, UserPlus, Sparkles } from "lucide-react";
import { characters } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Kender" },
      { name: "description", content: "Your latest activity on Kender." },
    ],
  }),
  component: NotificationsPage,
});

type Notif = {
  id: string;
  kind: "like" | "comment" | "follow" | "new";
  title: string;
  sub: string;
  time: string;
  img?: string;
};

const notifs: Notif[] = [
  { id: "n1", kind: "like",    title: "Sebastian Vale liked your message",        sub: "“I'll always wait for you…”",    time: "2m",  img: characters[2].image },
  { id: "n2", kind: "comment", title: "Kira Nyx replied to your chat",            sub: "“Firewall's patched. Your move.”", time: "14m", img: characters[0].image },
  { id: "n3", kind: "new",     title: "New character: Hana Aoki",                 sub: "Sweet, smart, and a little shy.",  time: "1h",  img: characters[7].image },
  { id: "n4", kind: "follow",  title: "@coven started following you",             sub: "Creator of Scarlet Hex",            time: "3h",  img: characters[5].image },
  { id: "n5", kind: "like",    title: "Lyra Goldleaf saved your last reply",      sub: "“The forest remembers.”",          time: "5h",  img: characters[1].image },
  { id: "n6", kind: "comment", title: "Mochi sent you a morning message",         sub: "“Coffee with me? ☕”",              time: "1d",  img: characters[3].image },
];

const iconFor = (k: Notif["kind"]) =>
  k === "like" ? Heart : k === "comment" ? MessageCircle : k === "follow" ? UserPlus : Sparkles;

function NotificationsPage() {
  return (
    <div className="safe-top">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/80 px-2 py-3 backdrop-blur-xl">
        <Link to="/" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full active:bg-surface">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold">Notifications</h1>
      </header>

      <ul className="divide-y divide-border/60">
        {notifs.map((n) => {
          const Icon = iconFor(n.kind);
          return (
            <li key={n.id} className="flex items-center gap-3 px-4 py-3">
              <div className="relative shrink-0">
                <img src={n.img} alt="" className="h-12 w-12 rounded-full object-cover" />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="h-3 w-3" />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{n.title}</p>
                <p className="truncate text-xs text-muted-foreground">{n.sub}</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
