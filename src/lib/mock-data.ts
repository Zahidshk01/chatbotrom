import c1 from "@/assets/char-1.jpg";
import c2 from "@/assets/char-2.jpg";
import c3 from "@/assets/char-3.jpg";
import c4 from "@/assets/char-4.jpg";
import c5 from "@/assets/char-5.jpg";
import c6 from "@/assets/char-6.jpg";
import c7 from "@/assets/char-7.jpg";
import c8 from "@/assets/char-8.jpg";

export type Character = {
  id: string;
  name: string;
  image: string;
  creator: string;
  chats: string;
  category: string;
  height: number; // tailwind h-* scale
  tagline: string;
  relation: string; // shown in brackets next to name — who they are to you / topic
};

export const categories = [
  "All",
  "Romance",
  "Anime",
  "Fantasy",
  "Gaming",
  "Friends",
  "Story",
  "Adventure",
  "Horror",
];

export const characters: Character[] = [
  { id: "1", name: "Kira Nyx",          image: c1, creator: "@nova",     chats: "1.2M", category: "Anime",    height: 96, tagline: "Cyberpunk hacker with a soft side.",        relation: "hacker friend" },
  { id: "2", name: "Lyra Goldleaf",     image: c2, creator: "@mythos",   chats: "842K", category: "Fantasy",  height: 72, tagline: "Elven warrior sworn to the forest.",        relation: "your bodyguard" },
  { id: "3", name: "Sebastian Vale",    image: c3, creator: "@nightowl", chats: "2.4M", category: "Romance",  height: 88, tagline: "A vampire lord with secrets.",              relation: "obsessive lover" },
  { id: "4", name: "Mochi",             image: c4, creator: "@kawaii",   chats: "560K", category: "Friends",  height: 64, tagline: "Your cozy morning companion.",              relation: "best friend" },
  { id: "5", name: "Cmdr. Rook",        image: c5, creator: "@orbit",    chats: "318K", category: "Adventure",height: 80, tagline: "Leads the 9th deep-space squad.",           relation: "your captain" },
  { id: "6", name: "Scarlet Hex",       image: c6, creator: "@coven",    chats: "1.8M", category: "Horror",   height: 76, tagline: "A witch with too many secrets.",            relation: "cursed ex" },
  { id: "7", name: "Det. Marlowe",      image: c7, creator: "@noirstudio",chats: "245K",category: "Story",    height: 84, tagline: "Walks the rain-slick streets alone.",       relation: "murder case" },
  { id: "8", name: "Hana Aoki",         image: c8, creator: "@sakura",   chats: "990K", category: "Anime",    height: 68, tagline: "Sweet, smart, and a little shy.",           relation: "childhood crush" },
];

export const trending = [
  "midnight romance", "yandere", "best friend", "isekai hero",
  "dark academia", "space opera", "high school", "detective noir",
];

export const recents = ["vampire lord", "cozy chat", "elf warrior"];

export type Chat = {
  id: string;
  characterId: string;
  name: string;
  image: string;
  last: string;
  time: string;
  unread: number;
  pinned?: boolean;
};

export const chats: Chat[] = [
  { id: "a", characterId: "3", name: "Sebastian Vale",  image: c3, last: "I've been waiting for you, my dear…", time: "2m",  unread: 3, pinned: true },
  { id: "b", characterId: "1", name: "Kira Nyx",        image: c1, last: "Did you patch the firewall yet?",    time: "14m", unread: 1 },
  { id: "c", characterId: "4", name: "Mochi",           image: c4, last: "Morning! Coffee with me? ☕",         time: "1h",  unread: 0 },
  { id: "d", characterId: "2", name: "Lyra Goldleaf",   image: c2, last: "The forest grows restless tonight.", time: "3h",  unread: 0 },
  { id: "e", characterId: "7", name: "Det. Marlowe",    image: c7, last: "We need to talk. Alone.",            time: "yest",unread: 0 },
];

export const profile = {
  name: "Alex Rivera",
  username: "@alexr",
  bio: "Building worlds, one character at a time. ✦",
  avatar: c8,
  stats: { created: 12, followers: "4.2K", following: 189, likes: "18.7K" },
};
