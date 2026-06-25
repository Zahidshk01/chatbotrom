import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, MoreVertical, Send, Sparkles, RotateCcw, Pencil, Check, X } from "lucide-react";
import { characters } from "@/lib/mock-data";

export const Route = createFileRoute("/chat/$id")({
  head: ({ params }) => {
    const c = characters.find((x) => x.id === params.id);
    return {
      meta: [
        { title: `${c?.name ?? "Chat"} · Kender` },
        { name: "description", content: c?.tagline ?? "Chat with an AI character." },
      ],
    };
  },
  component: ChatPage,
});

type Msg = {
  id: string;
  from: "me" | "them";
  text: string;
  variants?: string[]; // alternate replies (for "them")
  variantIndex?: number;
};

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

  const send = async () => {
  const v = text.trim();
  if (!v) return;

  const mine: Msg = {
    id: crypto.randomUUID(),
    from: "me",
    text: v,
  };

  // Add user message immediately
  const nextMsgs = [...msgs, mine];
  setMsgs(nextMsgs);
  setText("");

  try {
    const apiMessages = nextMsgs.map((m) => ({
      role: m.from === "me" ? "user" : "assistant",
      content: m.text,
    }));

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        characterName: char.name,
        characterDescription: char.tagline,
        characterCategory: char.category,
        characterRelation: char.relation,
        messages: apiMessages,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.details || data?.error || "Chat request failed");
    }

    const replyText = data.reply?.trim();
    if (!replyText) {
      throw new Error("No reply returned from Qwen");
    }

    const reply: Msg = {
      id: crypto.randomUUID(),
      from: "them",
      text: replyText,
    };

    setMsgs((m) => [...m, reply]);
  } catch (err) {
    const errorText =
      err instanceof Error ? err.message : "Something went wrong.";

    const reply: Msg = {
      id: crypto.randomUUID(),
      from: "them",
      text: `⚠️ ${errorText}`,
    };

    setMsgs((m) => [...m, reply]);
  }
};


  const cycleVariant = (mid: string) =>
    setMsgs((arr) =>
      arr.map((m) => {
        if (m.id !== mid || !m.variants) return m;
        const next = ((m.variantIndex ?? 0) + 1) % m.variants.length;
        return { ...m, variantIndex: next, text: m.variants[next] };
      }),
    );

  const editMessage = (mid: string, newText: string) =>
    setMsgs((arr) => arr.map((m) => (m.id === mid ? { ...m, text: newText } : m)));

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
        <div className="flex-1 text-center text-lg font-bold tracking-[0.2em]">KENDER</div>
        <button className="flex items-center gap-1 rounded-full px-2 text-xs font-semibold text-primary">
          Get Ultra <Sparkles className="h-4 w-4" />
        </button>
        <button aria-label="More" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface">
          <MoreVertical className="h-5 w-5" />
        </button>
      </header>

      {/* Scroll area */}
      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-4">
        {/* Character pill */}
        <div className="mb-6 flex items-center gap-3 rounded-full bg-surface px-3 py-2">
          <img src={char.image} alt={char.name} className="h-10 w-10 rounded-full object-cover" />
          <div className="truncate text-base font-semibold">
            {char.name} <span className="text-muted-foreground">({char.relation})</span>
          </div>
        </div>

        {/* Date divider */}
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>
            {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Opening narration as character message */}
        <CharacterMessage
          image={char.image}
          text={openingScene(char.name, char.category, char.tagline)}
        />

        {/* Messages */}
        <div className="mt-4 space-y-4">
          {msgs.map((m) =>
            m.from === "me" ? (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-surface px-4 py-2.5 text-sm">
                  {m.text}
                </div>
              </div>
            ) : (
              <CharacterMessage
                key={m.id}
                image={char.image}
                text={m.text}
                onRegenerate={m.variants && m.variants.length > 1 ? () => cycleVariant(m.id) : undefined}
                onEdit={(t) => editMessage(m.id, t)}
              />
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
              placeholder="Type a message"
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

/* ---------- Character message with rich formatting + actions ---------- */

function CharacterMessage({
  image,
  text,
  onRegenerate,
  onEdit,
}: {
  image: string;
  text: string;
  onRegenerate?: () => void;
  onEdit?: (newText: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  useEffect(() => setDraft(text), [text]);

  return (
    <div className="flex gap-2">
      <img src={image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
      <div className="min-w-0 flex-1">
        {editing ? (
          <div className="max-w-full">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-primary"
              rows={Math.max(3, draft.split("\n").length + 1)}
              autoFocus
            />
            <div className="mt-1 flex gap-2">
              <button
                onClick={() => {
                  onEdit?.(draft.trim() || text);
                  setEditing(false);
                }}
                className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
              >
                <Check className="h-3.5 w-3.5" /> Save
              </button>
              <button
                onClick={() => {
                  setDraft(text);
                  setEditing(false);
                }}
                className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md bg-surface px-4 py-3 text-sm leading-relaxed">
              <RichText text={text} />
            </div>
            {(onRegenerate || onEdit) && (
              <div className="flex flex-col gap-1.5 pt-1">
                {onEdit && (
                  <button
                    onClick={() => setEditing(true)}
                    aria-label="Edit reply"
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-surface text-muted-foreground active:scale-95"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
                {onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    aria-label="Try another reply"
                    className="flex h-8 w-8 items-center justify-center rounded-md bg-surface text-muted-foreground active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Renders text where:
 *  - "double quoted" segments => bold (spoken dialogue)
 *  - everything else => italic narration / thoughts
 */
function RichText({ text }: { text: string }) {
  // Split keeping the quoted parts (matches either "..." or “...”)
  const parts = text.split(/("[^"]*"|“[^”]*”)/g).filter(Boolean);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((p, i) => {
        const isSpeech = /^["“].*["”]$/.test(p);
        return isSpeech ? (
          <span key={i} className="font-bold text-foreground">{p}</span>
        ) : (
          <span key={i} className="italic text-foreground/85">{p}</span>
        );
      })}
    </p>
  );
}

/* ---------- Content generators ---------- */

function openingScene(name: string, category: string, tagline: string) {
  const first = name.split(" ")[0];
  switch (category) {
    case "Romance":
      return `${first} leans against the doorway, eyes locked on yours, a slow smile spreading across their face. "There you are. I was starting to wonder if you'd come."`;
    case "Horror":
      return `The room grows colder as ${first} steps from the shadows, voice barely a whisper. "You shouldn't have come back."`;
    case "Fantasy":
      return `${first} draws their blade halfway, then pauses — recognition flickering in their eyes. "Speak quickly. The forest is listening."`;
    case "Anime":
      return `${first} glances up from the glowing screens, smirking. "You're late. I almost started without you."`;
    case "Adventure":
      return `${first} tosses you a comm unit. "Strap in. We launch in sixty."`;
    case "Friends":
      return `${first} waves you over, two warm cups already on the table. "Took you long enough — sit, sit."`;
    default:
      return `${first} looks up as you arrive, expression unreadable. "${tagline}"`;
  }
}

// function repliesFor(name: string, input: string): string[] {
//   const first = name.split(" ")[0];
//   const snippet = input.slice(0, 40);
//   return [
//     `${first} tilts their head, considering you. "${snippet}…" they echo softly. A small smile tugs at the corner of their mouth.`,
//     `${first} crosses their arms and leans closer. "Now that's interesting. Tell me more — I want every detail."`,
//     `${first} laughs quietly, eyes glinting. "You always know exactly what to say, don't you?"`,
//   ];
// }
