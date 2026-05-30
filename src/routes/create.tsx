import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Sparkles, Globe, Lock, EyeOff } from "lucide-react";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create · Kender" },
      { name: "description", content: "Create your own AI character on Kender." },
    ],
  }),
  component: CreatePage,
});

const visibilityOptions = [
  { id: "public",   label: "Public",   icon: Globe,  desc: "Anyone can find" },
  { id: "private",  label: "Private",  icon: Lock,   desc: "Only you" },
  { id: "unlisted", label: "Unlisted", icon: EyeOff, desc: "Link only" },
] as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-[20px] bg-surface px-4 py-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50";

function CreatePage() {
  const [visibility, setVisibility] = useState<string>("public");

  return (
    <div className="safe-top px-4 pt-4">
      <h1 className="text-balance text-2xl font-bold tracking-tight">Create Your Character</h1>
      <p className="mt-1 text-sm text-muted-foreground">Bring a new personality to life.</p>

      <div className="mt-6 flex flex-col items-center">
        <button className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-surface ring-2 ring-border">
          <Camera className="h-7 w-7 text-muted-foreground" />
          <span className="absolute bottom-0 left-0 right-0 bg-background/60 py-1 text-[10px] font-semibold backdrop-blur">
            Upload
          </span>
        </button>
        <p className="mt-2 text-xs text-muted-foreground">Character avatar</p>
      </div>

      <div className="mt-6 space-y-4">
        <Field label="Character name">
          <input className={inputCls} placeholder="e.g. Luna Nightshade" />
        </Field>
        <Field label="Short description">
          <input className={inputCls} placeholder="One line that captures them" />
        </Field>
        <Field label="Greeting message">
          <textarea className={inputCls} rows={3} placeholder="The first words they say to a new user…" />
        </Field>
        <Field label="Personality" hint="Adjectives, quirks, speech patterns.">
          <textarea className={inputCls} rows={3} placeholder="Witty, loyal, slightly chaotic…" />
        </Field>
        <Field label="Backstory">
          <textarea className={inputCls} rows={4} placeholder="Where they come from, what shaped them…" />
        </Field>
        <Field label="Example conversations" hint="Optional. Helps the model match tone.">
          <textarea className={inputCls} rows={3} placeholder="User: Hi&#10;Char: Oh — it's you again." />
        </Field>
        <Field label="Tags">
          <input className={inputCls} placeholder="anime, romance, mysterious" />
        </Field>

        <Field label="Visibility">
          <div className="grid grid-cols-3 gap-2">
            {visibilityOptions.map(({ id, label, icon: Icon, desc }) => {
              const active = visibility === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVisibility(id)}
                  className={`rounded-[20px] p-3 text-center transition ${
                    active ? "bg-primary text-primary-foreground shadow-accent" : "bg-surface text-foreground"
                  }`}
                >
                  <Icon className="mx-auto h-5 w-5" />
                  <div className="mt-2 text-xs font-semibold">{label}</div>
                  <div className={`text-[10px] ${active ? "opacity-80" : "text-muted-foreground"}`}>{desc}</div>
                </button>
              );
            })}
          </div>
        </Field>
      </div>

      <div className="sticky bottom-24 mt-8 space-y-2 pb-4">
        <button className="flex h-14 w-full items-center justify-center rounded-[20px] gradient-accent text-base font-semibold text-primary-foreground shadow-accent active:scale-[0.99]">
          Create Character
        </button>
        <button className="flex h-12 w-full items-center justify-center gap-2 rounded-[20px] bg-surface text-sm font-semibold text-foreground active:bg-surface-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Generate With AI
        </button>
      </div>
    </div>
  );
}
