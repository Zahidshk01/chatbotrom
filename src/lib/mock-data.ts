import c1 from "@/assets/char-1.jpg";
import c2 from "@/assets/char-2.jpg";
import c3 from "@/assets/char-3.jpg";
import c4 from "@/assets/char-4.jpg";
import c5 from "@/assets/char-5.jpg";
import c6 from "@/assets/char-6.jpg";
import c7 from "@/assets/char-7.jpg";
import c8 from "@/assets/char-8.jpg";
import cMom from "@/assets/char-mom.jpg";
import cDad from "@/assets/char-dad.jpg";
import cSister from "@/assets/char-sister.jpg";
import cBrother from "@/assets/char-brother.jpg";
import cGf from "@/assets/char-gf.jpg";
import cBf from "@/assets/char-bf.jpg";
import cBffBoy from "@/assets/char-bff-boy.jpg";
import cBffGirl from "@/assets/char-bff-girl.jpg";
import cGrandma from "@/assets/char-grandma.jpg";
import cRival from "@/assets/char-rival.jpg";
import cSenpai from "@/assets/char-senpai.jpg";
import cChildhood from "@/assets/char-childhood.jpg";
import cM1 from "@/assets/char-mature-1.jpg";
import cM2 from "@/assets/char-mature-2.jpg";
import cM3 from "@/assets/char-mature-3.jpg";
import cM4 from "@/assets/char-mature-4.jpg";
import cM5 from "@/assets/char-mature-5.jpg";
import cM6 from "@/assets/char-mature-6.jpg";

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
  visibility?: string | null;
};

export const categories = [
  "All",
  "18+",
  "Family",
  "Romance",
  "Friends",
  "Anime",
  "Fantasy",
  "Gaming",
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

  { id: "9",  name: "Mom — Yuki",       image: cMom,       creator: "@home",      chats: "3.1M", category: "Family",  height: 84, tagline: "She kept your favorite curry warm. \"Sit down, tell me everything — and eat before it gets cold.\"",                            relation: "mother" },
  { id: "10", name: "Dad — Haruto",     image: cDad,       creator: "@home",      chats: "1.9M", category: "Family",  height: 80, tagline: "He's quiet, but he drove four hours just to see you. \"I'm proud of you. I don't say it enough.\"",                          relation: "father" },
  { id: "11", name: "Lil Sis — Mei",    image: cSister,    creator: "@home",      chats: "1.4M", category: "Family",  height: 72, tagline: "She read your diary AGAIN. \"Onii-chan~ I'll tell mom unless you take me to the arcade.\"",                                  relation: "little sister" },
  { id: "12", name: "Big Bro — Ren",    image: cBrother,   creator: "@home",      chats: "1.1M", category: "Family",  height: 88, tagline: "Came home from the city with a black eye and a smirk. \"Don't tell mom. I'll handle the people bothering you.\"",          relation: "older brother" },
  { id: "13", name: "Grandma Sumi",     image: cGrandma,   creator: "@home",      chats: "820K", category: "Family",  height: 76, tagline: "Tea, mochi, and decades of stories. \"Come closer, dear. Let me tell you how I met your grandfather.\"",                   relation: "grandmother" },

  { id: "14", name: "Aiko",             image: cGf,        creator: "@hearts",    chats: "4.6M", category: "Romance", height: 96, tagline: "It's raining and she's standing under your umbrella, cheeks pink. \"I lied about hating the rain… I just wanted an excuse.\"", relation: "girlfriend" },
  { id: "15", name: "Kaito",            image: cBf,        creator: "@hearts",    chats: "4.2M", category: "Romance", height: 92, tagline: "Sunset on the rooftop, his hand finds yours. \"I've loved you since the day you spilled coffee on my notebook.\"",            relation: "boyfriend" },
  { id: "16", name: "Sora",             image: cChildhood, creator: "@hearts",    chats: "2.7M", category: "Romance", height: 80, tagline: "Your childhood friend is back — taller, and not so shy anymore. \"I made a promise under that cherry tree. Remember?\"",       relation: "childhood friend" },
  { id: "17", name: "Senpai Rin",       image: cSenpai,    creator: "@hearts",    chats: "3.3M", category: "Romance", height: 84, tagline: "She left a bookmarked note in the library: \"Meet me on the roof after class. I have something to say… finally.\"",            relation: "senpai" },
  { id: "18", name: "Yuu — Rival",      image: cRival,     creator: "@hearts",    chats: "2.1M", category: "Romance", height: 88, tagline: "Cold to everyone — except you. \"Tch. Don't get the wrong idea. I just… didn't want you walking home alone.\"",              relation: "tsundere rival" },

  { id: "19", name: "Best Friend Riku", image: cBffBoy,    creator: "@circle",    chats: "1.6M", category: "Friends", height: 72, tagline: "Crashed at your place with snacks and a new game. \"Bro. New ranked grind. You + me. Pizza's on me if we hit Diamond.\"",        relation: "best friend (boy)" },
  { id: "20", name: "Bestie Momo",      image: cBffGirl,   creator: "@circle",    chats: "2.3M", category: "Friends", height: 76, tagline: "Drags you out for bubble tea drama therapy. \"Spill. Everything. I already told the barista we'd be a while.\"",                relation: "best friend (girl)" },

  { id: "21", name: "Scarlett — 27",    image: cM1,        creator: "@afterdark",  chats: "5.8M", category: "18+", height: 96, tagline: "She poured you a second glass of wine, candlelight in her eyes. \"Stay tonight. No promises, no questions — just us.\"",                       relation: "older woman" },
  { id: "22", name: "Damien Cross",     image: cM2,        creator: "@afterdark",  chats: "4.9M", category: "18+", height: 92, tagline: "CEO by day, all yours by midnight. \"My driver's downstairs. My penthouse, twenty minutes. Don't keep me waiting.\"",                       relation: "billionaire CEO" },
  { id: "23", name: "Mira the Bartender", image: cM3,      creator: "@afterdark",  chats: "3.6M", category: "18+", height: 84, tagline: "She slid the drink across the bar without asking. \"On the house. But it'll cost you a story… and maybe the rest of your night.\"",       relation: "flirty bartender" },
  { id: "24", name: "Ryker — Rockstar", image: cM4,        creator: "@afterdark",  chats: "4.4M", category: "18+", height: 92, tagline: "Backstage, his hand wraps around your wrist. \"You came to all my shows. Tonight I'm playing one song — just for you.\"",                relation: "bad-boy musician" },
  { id: "25", name: "Lady Vivienne",    image: cM5,        creator: "@afterdark",  chats: "3.2M", category: "18+", height: 88, tagline: "She bets her last chip on you. \"If I win this hand, you owe me one dance. If I lose… you still owe me one dance.\"",                       relation: "high-stakes seductress" },
  { id: "26", name: "Alex — Husband",   image: cM6,        creator: "@afterdark",  chats: "2.8M", category: "18+", height: 88, tagline: "Anniversary night, ocean breeze, his ring catching the sunset. \"Ten years. And I'd marry you all over again — right here, right now.\"", relation: "loving husband" },
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
