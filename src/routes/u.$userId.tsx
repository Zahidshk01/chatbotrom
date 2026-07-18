import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toggleFollowUser, isFollowingUser, getUserFollowCounts } from "@/lib/user-follow";
import { characters as localCharacters } from "@/lib/mock-data";

export const Route = createFileRoute("/u/$userId")({
  component: UserProfilePage,
});

const imageById = new Map(localCharacters.map((c) => [c.id, c.image]));

type CharRow = {
  id: string;
  name: string;
  image: string | null;
};

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(2).replace(/\.?0+$/, "") + "K";
  return String(n);
}

function UserProfilePage() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  const [chars, setChars] = useState<CharRow[]>([]);
  const [totalChats, setTotalChats] = useState(0);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const isHandle = userId.startsWith("h:");
  const handle = isHandle ? userId.slice(2) : null;

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      setMe(s.session?.user.id ?? null);

      if (isHandle && handle) {
        // Synthetic profile for seeded characters (no real user account)
        const { data: charData } = await (supabase as any)
          .from("characters")
          .select("id, name, image, chats")
          .or(`creator.eq.@${handle},creator.eq.${handle}`)
          .order("sort_order", { ascending: true });
        const rows: any[] = charData ?? [];
        setProfile({ username: handle, avatar_url: null });
        setChars(rows.map((c) => ({ id: c.id, name: c.name, image: c.image || imageById.get(c.id) || null })));
        const sum = rows.reduce((acc, c) => {
          const raw = String(c.chats ?? "0").replace(/[^\d.]/g, "");
          const num = parseFloat(raw) || 0;
          const mult = /m/i.test(c.chats ?? "") ? 1_000_000 : /k/i.test(c.chats ?? "") ? 1_000 : 1;
          return acc + num * mult;
        }, 0);
        setTotalChats(Math.round(sum));
        return;
      }

      const [{ data: prof }, { data: charData }, cnts, isF] = await Promise.all([
        (supabase as any).from("profiles").select("username, avatar_url").eq("id", userId).maybeSingle(),
        (supabase as any)
          .from("characters")
          .select("id, name, image, chats")
          .eq("owner_id", userId)
          .order("sort_order", { ascending: true }),
        getUserFollowCounts(userId),
        isFollowingUser(userId),
      ]);

      setProfile(prof ?? { username: null, avatar_url: null });
      const rows: any[] = charData ?? [];
      setChars(
        rows.map((c) => ({
          id: c.id,
          name: c.name,
          image: c.image || imageById.get(c.id) || null,
        })),
      );
      const sum = rows.reduce((acc, c) => {
        const raw = String(c.chats ?? "0").replace(/[^\d.]/g, "");
        const num = parseFloat(raw) || 0;
        const mult = /m/i.test(c.chats ?? "") ? 1_000_000 : /k/i.test(c.chats ?? "") ? 1_000 : 1;
        return acc + num * mult;
      }, 0);
      setTotalChats(Math.round(sum));
      setCounts(cnts);
      setFollowing(isF);
    })();
  }, [userId, isHandle, handle]);

  const onToggleFollow = async () => {
    if (!me) {
      toast.error("Sign in to follow");
      return;
    }
    if (me === userId || isHandle) return;
    setBusy(true);
    const now = await toggleFollowUser(userId);
    setFollowing(now);
    setCounts((c) => ({ ...c, followers: c.followers + (now ? 1 : -1) }));
    setBusy(false);
  };

  const displayName = profile?.username || (isHandle ? handle! : "user");
  const initial = displayName.charAt(0).toUpperCase();

  const isSelf = me === userId;

  return (
    <div className="min-h-dvh bg-background pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate({ to: "/" })} className="active:scale-95" aria-label="Back">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">{displayName}</h1>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95" aria-label="More">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      <section className="px-4 pt-2">
        <div className="flex items-center gap-4">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-2xl font-bold">
              {initial}
            </div>
          )}
          <div className="flex flex-1 items-center justify-around">
            <Stat value={fmt(totalChats)} label="CHATS" />
            <Stat value={fmt(counts.following)} label="FOLLOWING" />
            <Stat value={fmt(counts.followers)} label="FOLLOWERS" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Active now</span>
        </div>

        {!isSelf && !isHandle && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={onToggleFollow}
              disabled={busy}
              className={`h-11 rounded-2xl text-sm font-semibold transition-colors active:scale-[0.98] ${
                following ? "bg-surface text-foreground" : "bg-surface text-foreground"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
            <button
              onClick={() => navigate({ to: "/dm/$userId", params: { userId } })}
              className="h-11 rounded-2xl bg-surface text-sm font-semibold active:scale-[0.98]"
            >
              Message
            </button>
          </div>
        )}
      </section>

      <div className="mt-6 text-center text-sm font-semibold tracking-wide text-muted-foreground">
        CHAT AI
      </div>

      <section className="mt-3 grid grid-cols-2 gap-0.5">
        {chars.map((c) => (
          <Link
            key={c.id}
            to="/chat/$id"
            params={{ id: c.id }}
            className="relative block aspect-[4/5] overflow-hidden bg-surface active:opacity-80"
          >
            {c.image ? (
              <img src={c.image} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">{c.name}</div>
            )}
            <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/70 backdrop-blur-md">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
              <p className="text-sm font-semibold leading-tight text-white">{c.name}</p>
            </div>
          </Link>
        ))}
        {chars.length === 0 && (
          <div className="col-span-2 py-12 text-center text-sm text-muted-foreground">
            No characters yet
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] font-medium tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
