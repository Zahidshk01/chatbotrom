import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Image as ImageIcon, Sparkles, Upload, RotateCcw, Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

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

function CreatePage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");

  function onUpload(file?: File) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
    setShowImageMenu(false);
  }

  async function aiGenerateImage() {
    setShowImageMenu(false);
    setGenerating(true);
    // placeholder — use a stock-style portrait until wired to AI Gateway
    await new Promise((r) => setTimeout(r, 900));
    setImage(`https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/512`);
    setGenerating(false);
    toast("Generated a portrait. Tap the image to try again.");
  }

  function generateName() {
    setName(nameSamples[Math.floor(Math.random() * nameSamples.length)]);
  }

  function create() {
    if (!image) return toast("Add an image first");
    if (!name.trim()) return toast("Give your character a name");
    toast.success(`${name} is ready to chat`);
    navigate({ to: "/" });
  }

  return (
    <div className="safe-top px-5 pt-3 pb-28">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/" })}
          className="rounded-full bg-surface px-4 py-1.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 flex gap-1.5">
        <div className="h-1.5 flex-1 rounded-full bg-primary/80" />
        <div className="h-1.5 flex-1 rounded-full bg-surface" />
        <div className="h-1.5 flex-1 rounded-full bg-surface" />
      </div>

      <h1 className="mt-6 text-center text-3xl font-bold tracking-tight">Identity</h1>

      <section className="mt-7">
        <label className="mb-2 block text-sm font-semibold">Image</label>
        <div className="relative flex items-center gap-3 rounded-2xl bg-surface p-3">
          <button
            type="button"
            onClick={() => setShowImageMenu((v) => !v)}
            className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-2"
          >
            {image ? (
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            {generating && (
              <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                <Sparkles className="h-5 w-5 animate-pulse text-primary" />
              </div>
            )}
          </button>
          <div className="flex-1">
            <p className="text-[15px] font-semibold leading-snug">
              {image ? "Tap the image to change" : "Upload an Image for your Chat AI"}
            </p>
            <button
              onClick={() => setShowImageMenu((v) => !v)}
              className="mt-2 inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-sm"
            >
              <Upload className="h-4 w-4" />
              {image ? "Change" : "Upload"}
            </button>
          </div>

          {showImageMenu && (
            <div className="absolute left-3 top-[108px] z-20 w-[calc(100%-1.5rem)] overflow-hidden rounded-2xl border border-border bg-surface-2 shadow-elegant">
              <button
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-surface"
              >
                <Upload className="h-4 w-4 text-primary" /> Upload from device
              </button>
              <button
                onClick={aiGenerateImage}
                className="flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left text-sm hover:bg-surface"
              >
                <Sparkles className="h-4 w-4 text-primary" /> Generate with AI
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
        <label className="mb-2 block text-sm font-semibold">Name</label>
        <div className="rounded-2xl bg-surface px-4 py-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Add a name for your Chat AI"
            className="w-full bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-3 flex justify-end gap-5 border-t border-border pt-2.5 text-sm text-muted-foreground">
            <button onClick={generateName} className="flex items-center gap-1.5 active:text-foreground">
              <RotateCcw className="h-4 w-4" /> Generate
            </button>
            <button className="flex items-center gap-1.5 active:text-foreground">
              <Pencil className="h-4 w-4" /> Edit
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <label className="mb-2 block text-sm font-semibold">Visibility</label>
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
                  active ? "ring-2 ring-primary" : ""
                }`}
              >
                <div>
                  <div className="text-base font-semibold">{opt.title}</div>
                  <div className="text-sm text-muted-foreground">{opt.desc}</div>
                </div>
                {active ? (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
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

      <div className="fixed inset-x-0 bottom-20 px-5">
        <button
          onClick={create}
          disabled={!image || !name.trim()}
          className="h-13 w-full rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-accent disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
