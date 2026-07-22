import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Image as ImageIcon, Sparkles, Upload, RotateCcw, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create · Kender" },
      { name: "description", content: "Create your own AI character on Kender in seconds." },
    ],
  }),
  component: CreatePage,
});

const nameSamples = [
  "Luna Nightshade", "Kai Ember", "Selene Vox", "Orion Frost",
  "Rhea Hollow", "Jett Marlowe", "Aria Wraith", "Cassian Vale",
];

const CATEGORIES = [
  { id: "family", label: "Family" },
  { id: "friends", label: "Friends" },
  { id: "group", label: "Group" },
  { id: "school", label: "School" },
  { id: "relationships", label: "Relationships" },
  { id: "others", label: "Others (18+)" },
] as const;
type CategoryId = typeof CATEGORIES[number]["id"];

function CreatePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [image, setImage] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState("");
  const [generatingName, setGeneratingName] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [promptOpen, setPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [editingFirst, setEditingFirst] = useState(false);
  const [generatingFirst, setGeneratingFirst] = useState(false);
  const [category, setCategory] = useState<CategoryId>("friends");
  

  function onUpload(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setShowImageMenu(false);
    };
    reader.readAsDataURL(file);
  }

  function openAiPrompt() {
    setShowImageMenu(false);
    setPromptOpen(true);
  }

  async function aiGenerateImage() {
    if (!aiPrompt.trim()) return toast("Describe your character first");
    setPromptOpen(false);
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-character-image", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ prompt: aiPrompt, category }),
      });
      const json = (await res.json()) as {
        image?: string;
        error?: string;
        modelLabel?: string;
        fellBack?: boolean;
      };
      if (!res.ok || !json.image) {
        if (res.status === 429) toast("Rate limit hit. Try again in a moment.");
        else if (res.status === 402) toast("Out of AI credits. Add funds to continue.");
        else toast(json.error || "Couldn't generate image");
      } else {
        setImage(json.image);
        if (json.fellBack && json.modelLabel) {
          toast(`Switched to ${json.modelLabel} — primary model unavailable`);
        } else {
          toast("Anime portrait generated");
        }
      }
    } catch {
      toast("Network error generating image");
    } finally {
      setGenerating(false);
    }
  }

  async function generateName() {
    if (!image) {
      setName(nameSamples[Math.floor(Math.random() * nameSamples.length)]);
      return;
    }
    setGeneratingName(true);
    try {
      const res = await fetch("/api/generate-name", {
        method: "POST",
        headers: await authHeaders(),
      body: JSON.stringify({ image, description: aiPrompt, category }),

      });
      const json = (await res.json()) as { name?: string; error?: string };
      if (!res.ok || !json.name) {
        if (res.status === 429) toast("Rate limit hit. Try again in a moment.");
        else if (res.status === 402) toast("Out of AI credits. Add funds to continue.");
        else toast(json.error || "Couldn't generate name");
      } else {
        setName(json.name);
      }
    } catch {
      toast("Network error generating name");
    } finally {
      setGeneratingName(false);
    }
  }

  async function generateFirstMessage() {
    setGeneratingFirst(true);
    try {
      const res = await fetch("/api/generate-first-message", {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ name, description: aiPrompt, image }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok || !json.message) {
        if (res.status === 429) toast("Rate limit hit. Try again in a moment.");
        else if (res.status === 402) toast("Out of AI credits. Add funds to continue.");
        else toast(json.error || "Couldn't generate message");
      } else {
        setFirstMessage(json.message);
      }
    } catch {
      toast("Network error generating message");
    } finally {
      setGeneratingFirst(false);
    }
  }

  function goToFirstMessage() {
    if (!image) return toast("Add an image first");
    if (!name.trim()) return toast("Give your character a name");
    setStep(2);
    
  }

  async function finish() {
    if (!firstMessage.trim()) return toast("Add a first message");
    const { data: sess } = await supabase.auth.getSession();
    const owner_id = sess.session?.user.id ?? null;
    const id = crypto.randomUUID();
    const { error } = await (supabase as any).from("characters").insert({
      id,
      name: name.trim(),
      image,
      creator: sess.session?.user.email ? `@${sess.session.user.email.split("@")[0]}` : "@you",
      chats: "0",
      category: category === "others" ? "18+" : CATEGORIES.find((c) => c.id === category)!.label,
      height: 80,
      tagline: aiPrompt || firstMessage.slice(0, 80),
      relation: "your creation",
      first_message: firstMessage,
      persona: aiPrompt,
      visibility,
      owner_id,
      sort_order: -Math.floor(Date.now() / 1000),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${name} is ready to chat`);
    navigate({ to: "/chat/$id", params: { id } });
  }

  return (
    <div className="safe-top px-5 pt-3 pb-28">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium text-white"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 flex gap-1.5">
        <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-white" : "bg-surface"}`} />
        <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-white" : "bg-surface"}`} />
        <div className="h-1.5 flex-1 rounded-full bg-surface" />
      </div>

      {step === 1 && (
        <>
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">Identity</h1>

          <section className="mt-7">
            <label className="mb-2 block text-sm font-semibold text-white">Image</label>
            <div className="relative rounded-2xl bg-surface p-4">
              <button
                type="button"
                onClick={() => setShowImageMenu((v) => !v)}
                className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-xl bg-surface-2"
              >
                {image ? (
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="h-8 w-8 text-white/60" />
                    <span className="text-sm text-white/60">Add character image</span>
                  </div>
                )}
                {generating && (
                  <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                    <Sparkles className="h-5 w-5 animate-pulse text-white" />
                  </div>
                )}
              </button>

              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm text-white"
                >
                  <Upload className="h-4 w-4" />
                  {image ? "Change" : "Upload"}
                </button>
                <button
                  onClick={openAiPrompt}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-2.5 text-sm text-white"
                >
                  <Sparkles className="h-4 w-4" /> Generate AI
                </button>
              </div>

              {showImageMenu && (
                <div className="absolute left-4 right-4 top-48 z-20 overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-lg">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-surface"
                  >
                    <Upload className="h-4 w-4" /> Upload from device
                  </button>
                  <button
                    onClick={openAiPrompt}
                    className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm text-white hover:bg-surface"
                  >
                    <Sparkles className="h-4 w-4" /> Generate with AI
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </section>

          <section className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-white">Name</label>
            <div className="rounded-2xl bg-surface px-4 py-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Add a name for your Chat AI"
                className="w-full bg-transparent text-[15px] text-white outline-none placeholder:text-muted-foreground"
              />
              <div className="mt-2 flex justify-end gap-5 pt-1 text-sm text-muted-foreground">
                <button
                  onClick={generateName}
                  disabled={generatingName}
                  className="flex items-center gap-1.5 active:text-white disabled:opacity-50"
                >
                  <RotateCcw className={`h-4 w-4 ${generatingName ? "animate-spin" : ""}`} />
                  {generatingName ? "Generating…" : "Generate"}
                </button>
                <button className="flex items-center gap-1.5 active:text-white">
                  <Pencil className="h-4 w-4" /> Edit
                </button>
              </div>
            </div>
          </section>


          <section className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-white">Visibility</label>
            <div className="space-y-2.5">
              {(
                [
                  { id: "public", title: "Public", desc: "Visible and available to everyone" },
                  { id: "private", title: "Private", desc: "Only visible and available to you" },
                ] as const
              ).map((opt) => {
                const active = visibility === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setVisibility(opt.id)}
                    className={`flex w-full items-start justify-between rounded-2xl bg-surface p-4 text-left transition ${
                      active ? "ring-2 ring-white" : ""
                    }`}
                  >
                    <div>
                      <div className="text-base font-semibold text-white">{opt.title}</div>
                      <div className="text-sm text-muted-foreground">{opt.desc}</div>
                    </div>
                    {active ? (
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-background">
                        <Check className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="h-6 w-6 rounded-full border border-border" />
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-20 left-1/2 w-full max-w-md -translate-x-1/2 px-5">
            <button
              onClick={goToFirstMessage}
              disabled={!image || !name.trim()}
              className="h-13 w-full rounded-full bg-white py-3.5 text-base font-semibold text-background disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">First message</h1>
          <p className="mt-2 text-center text-[15px] text-muted-foreground">
            Specify the first message your chat AI will use to start conversations.
          </p>

          <div className="mt-6 flex flex-col items-center">
            <div className="h-24 w-24 overflow-hidden rounded-2xl bg-surface-2">
              {image && <img src={image} alt="" className="h-full w-full object-cover" />}
            </div>
            <p className="mt-2 text-[15px] font-medium text-white">{name}</p>
          </div>

          <div className="mt-5 rounded-2xl bg-surface p-4">
            {editingFirst ? (
              <textarea
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                rows={7}
                autoFocus
                className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-white outline-none"
              />
            ) : (
              <div className="min-h-[160px] whitespace-pre-wrap text-[15px] leading-relaxed text-white">
                {generatingFirst ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-4 w-4 animate-pulse text-white" /> Writing an opening scene…
                  </span>
                ) : (
                  firstMessage || (
                    <span className="text-muted-foreground">Tap Generate to draft an opener.</span>
                  )
                )}
              </div>
            )}
            <div className="mt-3 flex justify-end gap-5 border-t border-border pt-2.5 text-sm text-muted-foreground">
              <button
                onClick={generateFirstMessage}
                disabled={generatingFirst}
                className="flex items-center gap-1.5 active:text-white disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Generate
              </button>
              <button
                onClick={() => setEditingFirst((v) => !v)}
                className="flex items-center gap-1.5 active:text-white"
              >
                <Pencil className="h-4 w-4" /> {editingFirst ? "Done" : "Edit"}
              </button>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-16 left-1/2 flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-3 px-5">
            <button
              onClick={finish}
              disabled={!firstMessage.trim() || generatingFirst}
              className="h-13 w-full rounded-full bg-white py-3.5 text-base font-semibold text-background disabled:opacity-50"
            >
              Continue
            </button>
            <button
              onClick={() => setStep(1)}
              className="text-sm font-medium text-muted-foreground"
            >
              Back
            </button>
          </div>
        </>
      )}

      {promptOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !generating && setPromptOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-surface p-5 shadow-elegant"
          >
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-white" />
              <h2 className="text-lg font-semibold text-white">Generate anime character</h2>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Describe your character — looks, vibe, outfit, mood.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                aiGenerateImage();
              }}
            >
              <textarea
                autoFocus
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    e.preventDefault();
                    aiGenerateImage();
                  }
                }}
                placeholder="e.g. silver-haired swordswoman with violet eyes, hooded cloak, dusk lighting"
                rows={4}
                className="w-full resize-none rounded-2xl bg-surface-2 p-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-white"
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromptOpen(false)}
                  className="flex-1 rounded-full bg-surface-2 py-3 text-sm font-medium text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!aiPrompt.trim()}
                  className="flex-1 rounded-full bg-white py-3 text-sm font-semibold text-background disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
