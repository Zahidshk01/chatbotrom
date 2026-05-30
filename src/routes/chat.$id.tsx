import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, MoreVertical, Send, Sparkles } from "lucide-react";
import { characters } from "@/lib/mock-data";

export const Route = createFileRoute("/chat/$id")({
  head: ({ params }) => {
    const c = characters.find((x) => x.id === params.id);
    return {
      meta: [
        { title: `${c?.name ?? "Chat"} · CONVAE` },
        { name: "description", content: c?.tagline ?? "Chat with an AI character." },
      ],
    };
  },
  component: ChatPage,
});

type Msg = { id: string; from: "me" | "them"; text: string };

function ChatPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const char = characters.find((c) => c.id === id);
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  if (!char) {
    return (
      <div className="safe-top px-6 pt-20 text-center">
        <p className="text-muted-foreground">Character not found.</p>
        <Link to="/" className="mt-4 inline-block text-primary">Go home</Link>
      </div>
    );
  }

  const send = () => {
    const v = text.trim();
    if (!v) return;
    const mine: Msg = { id: crypto.randomUUID(), from: "me", text: v };
    setText("");
    setMsgs((m) => [...m, mine]);
    setTimeout(() => {
      const reply: Msg = {
        id: crypto.randomUUID(),
        from: "them",
        text: replyFor(char.name, v),
      };
      setMsgs((m) => [...m, reply]);
    }, 700);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background pb-0">
      {/* Header */}
      <header className="safe-top sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/85 px-3 py-3 backdrop-blur-xl">
        <button
          onClick={() => navigate({ to: "/" })}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-1 items-center gap-2 rounded-full bg-surface px-2 py-1">
          <img src={char.image} alt={char.name} className="h-8 w-8 rounded-full object-cover" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{char.name}</div>
            <div className="truncate text-[10px] text-muted-foreground">{char.creator}</div>
          </div>
        </div>
        <button className="flex items-center gap-1 rounded-full px-2 text-xs font-semibold text-primary">
          <Sparkles className="h-4 w-4" /> Ultra
        </button>
        <button aria-label="More" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        {/* Story card */}
        <div className="mx-auto mb-6 overflow-hidden rounded-[24px] bg-surface">
          <img src={char.image} alt={char.name} className="h-56 w-full object-cover" />
          <div className="p-4">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">{char.category}</span>
              <span>{char.chats} chats</span>
            </div>
            <h2 className="mt-2 text-lg font-bold">{char.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{char.tagline}</p>
          </div>
        </div>

        {/* Opening narration */}
        <div className="flex gap-2">
          <img src={char.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          <div className="max-w-[80%] space-y-2">
            <div className="rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-sm">
              <span className="font-semibold">{char.name}: </span>
              {char.tagline}
            </div>
            <div className="rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-sm italic text-muted-foreground">
              {openingScene(char.name, char.category)}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="mt-4 space-y-3">
          {msgs.map((m) =>
            m.from === "me" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-md gradient-accent px-4 py-2.5 text-sm text-primary-foreground shadow-accent">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex gap-2">
                <img src={char.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                <div className="max-w-[80%] rounded-2xl rounded-tl-md bg-surface px-4 py-2.5 text-sm">
                  {m.text}
                </div>
              </div>
            ),
          )}
        </div>
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-background/90 px-3 py-3 backdrop-blur-xl safe-bottom">
        <div className="flex items-end gap-2">
          <div className="flex flex-1 items-center rounded-full bg-surface px-4 py-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={`Message ${char.name.split(" ")[0]}…`}
              className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={send}
            aria-label="Send"
            className="flex h-11 w-11 items-center justify-center rounded-full gradient-accent text-primary-foreground shadow-accent active:scale-95"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function openingScene(name: string, category: string) {
  const first = name.split(" ")[0];
  switch (category) {
    case "Romance":
      return `*${first} leans against the doorway, eyes locked on yours, a slow smile spreading across their face.*`;
    case "Horror":
      return `*The room grows colder as ${first} steps from the shadows, voice barely a whisper.*`;
    case "Fantasy":
      return `*${first} draws their blade halfway, then pauses — recognition flickering in their eyes.*`;
    case "Anime":
      return `*${first} glances up from the glowing screens, smirking.* "You're late."`;
    case "Adventure":
      return `*${first} tosses you a comm unit.* "Strap in. We launch in sixty."`;
    case "Friends":
      return `*${first} waves you over, two warm cups already on the table.*`;
    default:
      return `*${first} looks up as you arrive, expression unreadable.*`;
  }
}

function replyFor(name: string, input: string) {
  const first = name.split(" ")[0];
  const lines = [
    `*${first} tilts their head, considering you.* "${input.slice(0, 60)}…" they echo softly.`,
    `"Tell me more," ${first} murmurs, stepping closer.`,
    `*A small smile.* "I wasn't expecting that from you."`,
    `${first} laughs quietly. "Interesting. Go on."`,
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}
