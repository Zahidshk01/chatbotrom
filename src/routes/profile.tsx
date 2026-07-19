import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Settings, Camera, Users as UsersIcon, ChevronRight, ChevronLeft,
  Mail, FileText, ShieldCheck, Info, LogOut, Trash2, BadgeCheck, Smile,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { characters, type Character } from "@/lib/mock-data";
import { useSavedIds } from "@/lib/saved-store";
import { useLikedIds } from "@/lib/liked-store";
import { useFollowing, useFollowers, toggleFollow } from "@/lib/follow-store";
import { useProfile, updateProfile } from "@/lib/profile-store";
import { supabase } from "@/integrations/supabase/client";
import { useBlockedTargets, unblockTarget } from "@/lib/block-store";
import { avatarForHandle } from "@/lib/creator-meta";

import { getUserFollowCounts } from "@/lib/user-follow";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · Kender" },
      { name: "description", content: "Your Kender profile, characters, and settings." },
    ],
  }),
  component: ProfilePage,
});

const APP_VERSION = "v2.4.1";

type TabKey = "characters" | "liked" | "saved";

function ProfilePage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const savedIds = useSavedIds();
  const likedIds = useLikedIds();
  const following = useFollowing();
  const followers = useFollowers();

  const savedChars = useMemo(
    () => characters.filter((c) => savedIds.includes(c.id)),
    [savedIds],
  );
  const likedChars = useMemo(
    () => characters.filter((c) => likedIds.includes(c.id)),
    [likedIds],
  );
  const [myChars, setMyChars] = useState<Character[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState({ followers: 0, following: 0 });


  useEffect(() => {
    let cancelled = false;
    async function loadMine() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) setUid(user?.id ?? null);
      if (!user) { if (!cancelled) setMyChars([]); return; }
      const { data, error } = await supabase
        .from("characters")
        .select("id,name,image,creator,chats,category,height,tagline,relation")
        .eq("owner_id", user.id)
        .order("sort_order", { ascending: false });
      if (cancelled || error || !data) return;
      setMyChars(data.map((c) => ({
        id: c.id,
        name: c.name,
        image: c.image ?? "",
        creator: c.creator ?? "@you",
        chats: c.chats ?? "0",
        category: c.category ?? "Original",
        height: c.height ?? 64,
        tagline: c.tagline ?? "",
        relation: c.relation ?? "",
      })));
    }
    loadMine();
    const { data: sub } = supabase.auth.onAuthStateChange(() => loadMine());
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!uid) { setLiveCounts({ followers: 0, following: 0 }); return; }
    getUserFollowCounts(uid).then((c) => { if (!cancelled) setLiveCounts(c); });
    return () => { cancelled = true; };
  }, [uid, following.length]);


  const [tab, setTab] = useState<TabKey>("characters");
  const [editOpen, setEditOpen] = useState(false);
  const [listDialog, setListDialog] = useState<null | "following" | "followers">(null);
  const [detailChar, setDetailChar] = useState<Character | null>(null);


  const tabItems: { key: TabKey; label: string }[] = [
    { key: "characters", label: "Characters" },
    { key: "liked", label: "Liked" },
    { key: "saved", label: "Saved" },
  ];

  return (
    <div className="safe-top min-h-screen bg-background pb-32">
      {/* Top bar with settings icon */}
      <div className="flex items-center justify-end px-4 pt-3">
        <button
          onClick={() => navigate({ to: "/settings" })}
          aria-label="Settings"
          className="rounded-full p-2 text-foreground/90 active:bg-surface"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {/* Avatar */}
      <div className="mt-2 flex flex-col items-center px-4">
        <div className="relative">
          {profile.avatar ? (
            <img
              src={profile.avatar}
              alt={profile.username}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface text-2xl font-bold text-foreground/70">
              {profile.username.replace("@", "").slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <h1 className="mt-3 text-lg font-semibold">{profile.username}</h1>

        {/* Stats */}
        <div className="mt-4 grid w-full max-w-xs grid-cols-3">
          {(() => {
            const fmt = (n: number) => {
              if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
              if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
              return String(n);
            };
            return (
              <>
                <Stat value={fmt(liveCounts.following)} label="Following" onClick={() => setListDialog("following")} />
                <Stat value={fmt(liveCounts.followers)} label="Followers" onClick={() => setListDialog("followers")} />
                <Stat value={profile.stats.interactions} label="Interactions" />
              </>
            );
          })()}
        </div>


        {/* Bio */}
        <p className="mt-4 text-center text-sm text-foreground/85">{profile.bio}</p>

        {/* Edit button */}
        <button
          onClick={() => setEditOpen(true)}
          className="mt-3 rounded-full bg-surface px-8 py-2 text-sm font-semibold active:bg-surface-2"
        >
          Edit
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b border-border/60">
        <div className="grid grid-cols-3">
          {tabItems.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative py-3 text-sm"
              >
                <span className={active ? "font-semibold text-foreground" : "text-muted-foreground"}>
                  {t.label}
                </span>
                {active && (
                  <span className="absolute inset-x-6 -bottom-px h-0.5 bg-foreground" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 pt-6">
        {tab === "characters" && (
          <TabContent
            items={myChars}
            emptyIcon={<UsersIcon className="h-6 w-6 text-muted-foreground" />}
            emptyTitle="Create your first character"
            action={{ label: "Create", onClick: () => navigate({ to: "/create" }) }}
            onItemClick={(c) => setDetailChar(c)}
          />
        )}

        {tab === "liked" && (
          <TabContent
            items={likedChars}
            emptyIcon={<UsersIcon className="h-6 w-6 text-muted-foreground" />}
            emptyTitle="No liked characters yet"
            emptyHint="Tap the heart on any character to see them here."
          />
        )}
        {tab === "saved" && (
          <TabContent
            items={savedChars}
            emptyIcon={<UsersIcon className="h-6 w-6 text-muted-foreground" />}
            emptyTitle="No saved characters yet"
            emptyHint="Tap the bookmark on any character to save them."
          />
        )}
      </div>

      {/* Get Premium banner */}
      <div className="mx-4 mt-8 overflow-hidden rounded-2xl bg-surface">
        <button
          onClick={() => navigate({ to: "/premium" })}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2"
        >
          <BadgeCheck className="h-5 w-5 text-amber-400" />
          <span className="flex-1 text-sm font-medium">Upgrade to Pro</span>
          <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-600 px-3 py-1 text-xs font-bold text-black">
            Get Premium
          </span>
        </button>
      </div>

      {/* Edit profile dialog */}
      <EditProfileDialog open={editOpen} onOpenChange={setEditOpen} />


      <CharacterDetailsDialog
        char={detailChar}
        onClose={() => setDetailChar(null)}
        onDeleted={(id) => {
          setDetailChar(null);
          setMyChars((prev) => prev.filter((c) => c.id !== id));
        }}
        onOpenChat={(id) => {
          setDetailChar(null);
          navigate({ to: "/chat/$id", params: { id } });
        }}
      />

      <FollowListDialog
        open={listDialog !== null}
        kind={listDialog}
        onClose={() => setListDialog(null)}
        following={following}
        followers={followers}
      />

    </div>
  );
}

function Stat({
  value,
  label,
  onClick,
}: {
  value: number | string;
  label: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </>
  );
  if (onClick) {
    return (
      <button onClick={onClick} className="flex flex-col items-center active:opacity-70">
        {inner}
      </button>
    );
  }
  return <div className="flex flex-col items-center">{inner}</div>;
}

function TabContent({
  items,
  emptyIcon,
  emptyTitle,
  emptyHint,
  action,
  onItemClick,
}: {
  items: Character[];
  emptyIcon: React.ReactNode;
  emptyTitle: string;
  emptyHint?: string;
  action?: { label: string; onClick: () => void };
  onItemClick?: (c: Character) => void;
}) {
  const navigate = useNavigate();
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="mb-3">{emptyIcon}</div>
        <p className="text-sm text-foreground/85">{emptyTitle}</p>
        {emptyHint && <p className="mt-1 text-xs text-muted-foreground">{emptyHint}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 rounded-full bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground active:opacity-90"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((c) => (
        <button
          key={c.id}
          onClick={() =>
            onItemClick
              ? onItemClick(c)
              : navigate({ to: "/chat/$id", params: { id: c.id } })
          }
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


function MenuRow({
  icon, label, onClick, right, isLast, hideChevron, labelClass,
}: {
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  right?: React.ReactNode;
  isLast?: boolean;
  hideChevron?: boolean;
  labelClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-surface-2 ${isLast ? "" : "border-b border-border/40"}`}
    >
      <span className="flex h-6 w-6 items-center justify-center">{icon}</span>
      {label && (
        <span className={`flex-1 text-sm font-semibold ${labelClass ?? ""}`}>
          {label}
        </span>
      )}
      {!label && <span className="flex-1" />}
      {right}
      {!hideChevron && <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground" />}
    </button>
  );
}

function InfoDialog({
  open, onClose, title, body,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="text-sm leading-relaxed text-foreground/85">{body}</div>
      </DialogContent>
    </Dialog>
  );
}

function EditProfileDialog({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const profile = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(profile.avatar);

  // Sync fields when dialog opens
  useEffect(() => {
    if (open) {
      setUsername(profile.username);
      setBio(profile.bio);
      setAvatar(profile.avatar);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function onPickFile(file?: File) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast("Image too large (max 5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function save() {
    let u = username.trim();
    if (!u) return toast("Username can't be empty");
    if (u.length > 30) return toast("Username too long (max 30)");
    if (!u.startsWith("@")) u = "@" + u;
    if (bio.length > 160) return toast("Bio too long (max 160)");
    updateProfile({ username: u, bio: bio.trim(), avatar });
    toast("Profile updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Change your photo, username and bio.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative"
          >
            {avatar ? (
              <img src={avatar} alt="avatar" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-surface text-2xl font-bold text-foreground/70">
                {username.replace("@", "").slice(0, 1).toUpperCase() || "?"}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow">
              <Camera className="h-3.5 w-3.5" />
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={31}
              className="w-full rounded-xl bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              placeholder="@yourname"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">Bio</span>
            <div className="relative">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                className="w-full resize-none rounded-xl bg-surface px-4 py-2.5 pr-11 text-sm outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tell people about you"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    aria-label="Add emoji"
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto rounded-2xl border-white/10 bg-transparent p-0 shadow-none">
                  <EmojiPicker
                    emojiStyle={EmojiStyle.APPLE}
                    theme={Theme.DARK}
                    lazyLoadEmojis
                    searchDisabled={false}
                    skinTonesDisabled
                    previewConfig={{ showPreview: false }}
                    width={320}
                    height={400}
                    onEmojiClick={(data) => {
                      if ((bio + data.emoji).length <= 160) setBio(bio + data.emoji);
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <span className="mt-1 block text-right text-[10px] text-muted-foreground">
              {bio.length}/160
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FollowListDialog({
  open,
  kind,
  onClose,
  following,
  followers,
}: {
  open: boolean;
  kind: "following" | "followers" | null;
  onClose: () => void;
  following: string[];
  followers: string[];
}) {
  const list = kind === "followers" ? followers : following;
  const title = kind === "followers" ? "Followers" : "Following";

  // Build a lookup from creator handle → representative character (for avatar)
  const byCreator = useMemo(() => {
    const map = new Map<string, Character>();
    for (const c of characters) {
      const key = (c.creator ?? "").replace(/^@/, "").toLowerCase();
      if (key && !map.has(key)) map.set(key, c);
    }
    return map;
  }, []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {list.length === 0
              ? kind === "followers"
                ? "You don't have any followers yet."
                : "You aren't following anyone yet."
              : `${list.length} ${list.length === 1 ? "person" : "people"}`}
          </DialogDescription>
        </DialogHeader>

        {list.length > 0 && (
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {list.map((handle) => {
              const clean = handle.replace(/^@/, "");
              const char = byCreator.get(clean.toLowerCase());
              const isFollowing = following.includes(handle);
              return (
                <div
                  key={handle}
                  className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2"
                >
                  {char?.image ? (
                    <img
                      src={char.image}
                      alt={handle}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-2 text-sm font-bold">
                      {clean.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">@{clean}</p>
                    {char && (
                      <p className="truncate text-xs text-muted-foreground">
                        {char.name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFollow(handle)}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      isFollowing
                        ? "bg-surface-2 text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CharacterDetailsDialog({
  char,
  onClose,
  onDeleted,
  onOpenChat,
}: {
  char: Character | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
  onOpenChat: (id: string) => void;
}) {
  const [stats, setStats] = useState<{ likes: number; saves: number; chats: number } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!char) { setStats(null); return; }
    let cancelled = false;
    (async () => {
      const [likesRes, savesRes, chatsRes] = await Promise.all([
        supabase.from("user_likes").select("user_id", { count: "exact", head: true }).eq("character_id", char.id),
        supabase.from("user_saves").select("user_id", { count: "exact", head: true }).eq("character_id", char.id),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("character_id", char.id),
      ]);
      if (cancelled) return;
      setStats({
        likes: likesRes.count ?? 0,
        saves: savesRes.count ?? 0,
        chats: chatsRes.count ?? 0,
      });
    })();
    return () => { cancelled = true; };
  }, [char]);

  async function handleDelete() {
    if (!char) return;
    setDeleting(true);
    try {
      // Best-effort cleanup of the current user's own related rows (RLS scopes to auth.uid()).
      await Promise.all([
        supabase.from("chat_messages").delete().eq("character_id", char.id),
        supabase.from("user_likes").delete().eq("character_id", char.id),
        supabase.from("user_saves").delete().eq("character_id", char.id),
      ]);
      const { error } = await supabase.from("characters").delete().eq("id", char.id);
      if (error) throw error;
      toast.success("Character deleted");
      onDeleted(char.id);
    } catch (e) {
      toast.error("Could not delete character");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <Dialog open={char !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        {char && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  aria-label="Back"
                  className="rounded-full p-1 text-foreground/80 active:bg-surface"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <DialogTitle>{char.name}</DialogTitle>
              </div>
              <DialogDescription>{char.tagline || char.relation || "Your character"}</DialogDescription>
            </DialogHeader>
            {char.image && (
              <img
                src={char.image}
                alt={char.name}
                className="aspect-[4/5] w-full rounded-2xl object-cover"
              />
            )}
            <div className="grid grid-cols-3 gap-2">
              <StatBox label="Likes" value={stats?.likes ?? "—"} />
              <StatBox label="Chats" value={stats?.chats ?? "—"} />
              <StatBox label="Saved" value={stats?.saves ?? "—"} />
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <button
                onClick={() => onOpenChat(char.id)}
                className="flex-1 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold"
              >
                Open chat
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white active:opacity-90"
                aria-label="Delete character"
                title="Delete character"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
      <Dialog open={confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this character?</DialogTitle>
            <DialogDescription>
              This will permanently remove the character and your chats with them. This can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 rounded-full bg-surface px-4 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              disabled={deleting}
              onClick={handleDelete}
              className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function StatBox({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface py-3">
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function BlockedUsersSection() {
  const blocked = useBlockedTargets();
  const [profiles, setProfiles] = useState<Record<string, { username: string | null; avatar_url: string | null }>>({});

  useEffect(() => {
    const uuids = blocked.filter((t) => !t.startsWith("h:"));
    if (uuids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", uuids);
      const map: Record<string, { username: string | null; avatar_url: string | null }> = {};
      (data ?? []).forEach((p: any) => {
        map[p.id] = { username: p.username, avatar_url: p.avatar_url };
      });
      setProfiles(map);
    })();
  }, [blocked.join(",")]);

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">Blocked users</div>
      {blocked.length === 0 ? (
        <p className="text-sm text-muted-foreground">You haven't blocked anyone.</p>
      ) : (
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {blocked.map((t) => {
            const isHandle = t.startsWith("h:");
            const handle = isHandle ? t.slice(2) : null;
            const p = !isHandle ? profiles[t] : null;
            const name = isHandle ? `@${handle}` : p?.username || "user";
            const avatar = isHandle ? avatarForHandle(handle!) : p?.avatar_url || "";
            return (
              <div key={t} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2">
                {avatar ? (
                  <img src={avatar} alt={name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-sm font-bold">
                    {name.charAt(name.startsWith("@") ? 1 : 0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 truncate text-sm">{name}</div>
                <button
                  onClick={() => unblockTarget(t)}
                  className="rounded-full bg-background px-3 py-1.5 text-xs font-semibold"
                >
                  Unblock
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


