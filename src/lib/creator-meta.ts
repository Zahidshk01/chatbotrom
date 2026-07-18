import { characters } from "@/lib/mock-data";

/** Normalize a handle to a bare form without leading '@'. */
export function normalizeHandle(h: string | null | undefined): string {
  if (!h) return "";
  return h.replace(/^@/, "").toLowerCase();
}

/** Map of creator handle → representative avatar image (first character image). */
const handleToAvatar = new Map<string, string>();
for (const c of characters) {
  const h = normalizeHandle(c.creator);
  if (h && !handleToAvatar.has(h)) handleToAvatar.set(h, c.image);
}

export function avatarForHandle(handle: string | null | undefined): string | null {
  const h = normalizeHandle(handle);
  if (!h) return null;
  return handleToAvatar.get(h) ?? null;
}

const bios: Record<string, string> = {
  nova: "Cyberpunk dreams & neon nights ✨",
  mythos: "Weaving legends from forest & flame 🌿",
  nightowl: "Stories that keep you up till dawn 🌙",
  kawaii: "Soft vibes, cozy characters 🍡",
  orbit: "Deep space stories, one crew at a time 🚀",
  coven: "Witchcraft, curses, and other bad ideas 🕯️",
  noirstudio: "Rain-slick streets & unsolved cases ☔",
  sakura: "Sweet slice-of-life & first crushes 🌸",
  home: "Family you can always come home to 🏡",
  hearts: "Love stories in every flavor 💌",
  circle: "Friends who feel like family 🫂",
  afterdark: "For grown-up nights only 🌃 18+",
};

export function bioForHandle(handle: string | null | undefined): string {
  const h = normalizeHandle(handle);
  return bios[h] || "Building characters on Kender ✦";
}
