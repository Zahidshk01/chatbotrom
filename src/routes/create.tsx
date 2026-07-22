import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  Image as ImageIcon, Sparkles, Upload, RotateCcw, Pencil, Check, X,
  ChevronLeft, Globe, Lock, Wand2, ArrowRight,
} from "lucide-react";
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
    };
    reader.readAsDataURL(file);
  }

  function openAiPrompt() {
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
    <div className="safe-top min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3">
        <button
          onClick={() => step === 1 ? navigate({ to: "/" }) : setStep(1)}
          className="rounded-full p-2 text-foreground/90 active:bg-surface"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-wide">Create</h1>
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full p-2 text-foreground/90 active:bg-surface"
          aria-label="Cancel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Progress */}
      <div className="mx-4 mt-4 overflow-hidden rounded-full bg-surface">
        <div className="grid grid-cols-2">
          <div className={`py-2.5 text-center text-xs font-semibold transition-colors ${step === 1 ? "bg-white text-background" : "text-foreground/70"}`}>
            Identity
          </div>
          <div className={`py-2.5 text-center text-xs font-semibold transition-colors ${step === 2 ? "bg-white text-background" : "text-foreground/70"}`}>
            First message
          </div>
        </div>
      </div>

      {step === 1 && (
        <div className="px-4 pt-6">
          {/* Image card */}
          <section className="rounded-[28px] bg-surface p-4">
            <div className="flex items-center justify-between px-1 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Character image</span>
              <span className="text-[10px] text-muted-foreground">{image ? "1/1" : "0/1"}</span>
            </div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-surface-2"
            >
              {image ? (
                <img src={image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background">
                    <ImageIcon className="h-6 w-6 text-foreground/50" />
                  </div>
                  <span className="text-sm text-muted-foreground">Tap to upload</span>
                </div>
              )}
              {generating && (
                <div className="absolute inset-0 grid place-items-center bg-background/70 backdrop-blur-sm">
                  <Sparkles className="h-5 w-5 animate-pulse text-foreground" />
                </div>
              )}
            </button>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-full bg-surface-2 py-2.5 text-xs font-semibold text-foreground active:bg-background"
              >
                <Upload className="h-4 w-4" />
                {image ? "Change image" : "Upload image"}
              </button>
              <button
                onClick={openAiPrompt}
                className="flex items-center justify-center gap-2 rounded-full bg-white py-2.5 text-xs font-semibold text-background active:opacity-90"
              >
                <Wand2 className="h-4 w-4" />
                Generate AI
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onUpload(e.target.files?.[0])}
            />
          </section>

          {/* Name */}
          <section className="mt-5">
            <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</label>
            <div className="rounded-[28px] bg-surface p-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aria Wraith"
                className="w-full bg-transparent text-[17px] font-semibold text-foreground outline-none placeholder:text-muted-foreground"
              />
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">{name.length}/30</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={generateName}
                    disabled={generatingName}
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 active:text-foreground disabled:opacity-50"
                  >
                    <RotateCcw className={`h-3.5 w-3.5 ${generatingName ? "animate-spin" : ""}`} />
                    {generatingName ? "Generating…" : "Generate"}
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 active:text-foreground">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Category */}
          <section className="mt-5">
            <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {CATEGORIES.map((c) => {
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition active:scale-95 ${
                      active
                        ? "bg-white text-background"
                        : "bg-surface text-foreground/80"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Visibility */}
          <section className="mt-5">
            <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visibility</label>
            <div className="space-y-2.5">
              {(
                [
                  { id: "public", title: "Public", desc: "Visible to everyone on Kender", icon: Globe },
                  { id: "private", title: "Private", desc: "Only you can see this character", icon: Lock },
                ] as const
              ).map((opt) => {
                const active = visibility === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setVisibility(opt.id)}
                    className={`flex w-full items-center gap-4 rounded-[24px] bg-surface p-4 text-left transition active:scale-[0.99] ${
                      active ? "ring-1 ring-inset ring-foreground/30" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-2">
                      <Icon className="h-4 w-4 text-foreground/80" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[15px] font-semibold text-foreground">{opt.title}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
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

          {/* Continue */}
          <div className="fixed inset-x-0 bottom-20 left-1/2 w-full max-w-md -translate-x-1/2 px-4">
            <button
              onClick={goToFirstMessage}
              disabled={!image || !name.trim()}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-semibold text-background active:opacity-90 disabled:opacity-40"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="px-4 pt-8">
          {/* Character preview */}
          <div className="flex flex-col items-center">
            <div className="relative h-28 w-28 overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
              {image && <img src={image} alt="" className="h-full w-full object-cover" />}
            </div>
            <h2 className="mt-3 text-xl font-semibold">{name}</h2>
            <p className="text-xs text-muted-foreground">{CATEGORIES.find(c => c.id === category)?.label} · {visibility}</p>
          </div>

          {/* First message */}
          <section className="mt-6">
            <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Opening message</label>
            <div className="rounded-[28px] bg-surface p-4">
              {editingFirst ? (
                <textarea
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  rows={6}
                  autoFocus
                  className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                />
              ) : (
                <div className="min-h-[140px] whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
                  {generatingFirst ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Sparkles className="h-4 w-4 animate-pulse text-foreground" /> Writing an opening scene…
                    </span>
                  ) : (
                    firstMessage || (
                      <span className="text-muted-foreground">Tap generate to draft an opener.</span>
                    )
                  )}
                </div>
              )}
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">{firstMessage.length}/500</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={generateFirstMessage}
                    disabled={generatingFirst}
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 active:text-foreground disabled:opacity-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Generate
                  </button>
                  <button
                    onClick={() => setEditingFirst((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80 active:text-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {editingFirst ? "Done" : "Edit"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Action buttons */}
          <div className="fixed inset-x-0 bottom-20 left-1/2 w-full max-w-md -translate-x-1/2 px-4">
            <div className="space-y-3">
              <button
                onClick={finish}
                disabled={!firstMessage.trim() || generatingFirst}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-white text-base font-semibold text-background active:opacity-90 disabled:opacity-40"
              >
                Create character
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-sm font-medium text-muted-foreground active:text-foreground"
              >
                Back to identity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI prompt modal */}
      {promptOpen && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !generating && setPromptOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-[28px] bg-surface p-5"
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2">
                <Wand2 className="h-4 w-4 text-foreground" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Generate with AI</h2>
            </div>
            <p className="mb-3 text-sm text-muted-foreground">
              Describe the look, vibe, and outfit of your character.
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
                className="w-full resize-none rounded-2xl bg-surface-2 p-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-white"
              />
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPromptOpen(false)}
                  className="flex-1 rounded-full bg-surface-2 py-3 text-sm font-medium text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!aiPrompt.trim()}
                  className="flex-1 rounded-full bg-white py-3 text-sm font-semibold text-background disabled:opacity-50"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
