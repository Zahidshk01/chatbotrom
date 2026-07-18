import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dm/$userId")({
  component: DMPage,
});

type Msg = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
};

function DMPage() {
  const { userId: otherId } = Route.useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [other, setOther] = useState<{ username: string | null; avatar_url: string | null } | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id ?? null;
      setMe(uid);
      if (!uid) return;

      const [{ data: prof }, { data: msgs }] = await Promise.all([
        (supabase as any).from("profiles").select("username, avatar_url").eq("id", otherId).maybeSingle(),
        (supabase as any)
          .from("direct_messages")
          .select("*")
          .or(
            `and(sender_id.eq.${uid},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${uid})`,
          )
          .order("created_at", { ascending: true }),
      ]);
      setOther(prof ?? null);
      setMessages((msgs ?? []) as Msg[]);
    })();
  }, [otherId]);

  // Realtime subscription for new messages in this pair
  useEffect(() => {
    if (!me) return;
    const channel = (supabase as any)
      .channel(`dm-${me}-${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload: any) => {
          const m = payload.new as Msg;
          const belongs =
            (m.sender_id === me && m.recipient_id === otherId) ||
            (m.sender_id === otherId && m.recipient_id === me);
          if (!belongs) return;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [me, otherId]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || !me || sending) return;
    setSending(true);
    setText("");
    const { data, error } = await (supabase as any)
      .from("direct_messages")
      .insert({ sender_id: me, recipient_id: otherId, content })
      .select()
      .single();
    if (!error && data) {
      setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data as Msg]));
    }
    setSending(false);
  };

  const name = other?.username || "user";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border/40 bg-background/90 px-3 py-3 backdrop-blur-md">
        <button onClick={() => navigate({ to: "/u/$userId", params: { userId: otherId } })} aria-label="Back" className="active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        {other?.avatar_url ? (
          <img src={other.avatar_url} alt={name} className="h-9 w-9 rounded-full object-cover" />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-sm font-bold">
            {initial}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-[11px] text-emerald-500">Active now</p>
        </div>
      </header>

      <div ref={scroller} className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <p className="pt-16 text-center text-sm text-muted-foreground">Say hi 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === me;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-3xl px-4 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-surface text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 border-t border-border/40 bg-background px-3 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Message..."
          className="flex-1 rounded-full bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 active:scale-95"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
