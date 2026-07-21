import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  image: z.string().trim().min(1).max(15_000_000).optional(),
  description: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(60).optional(),
  mode: z.enum(["mixed", "scenario", "label", "name"]).optional(),
});

async function requireAuth(request: Request): Promise<Response | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const token = authHeader.slice("Bearer ".length);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

export const Route = createFileRoute("/api/generate-name")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authFail = await requireAuth(request);
        if (authFail) return authFail;

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid input" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
        const { image, description, category, mode } = parsed.data;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "AI generation is not configured." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const catKey = (category || "").toLowerCase();
        const categoryHints: Record<string, string> = {
          family: `Hook examples: "Ryo · Overprotective big brother catches you sneaking out", "Strict mom waited up all night", "Bratty little sister steals your hoodie", "Dad's best friend drops by unannounced", "Family road trip gone wrong".`,
          friends: `Hook examples: "Kaito · Your college bestie confesses at 3AM", "Mafia friends drag you to a shootout", "Childhood friend returns after 10 years", "Rich kid bestie throws you a yacht party", "Gamer friend won't log off".`,
          group: `Hook examples: "The Crimson Six · Mafia crew you owe money to", "Idol group backstage meltdown", "Delinquent gang claims the rooftop", "Adventuring party at the tavern", "Band rehearsal turns into a fight".`,
          school: `Hook examples: "Haru · Rude senpai corners you after class", "Nerdy classmate tutors you late", "Delinquent boyfriend skips class with you", "Student council president caught you cheating", "Transfer student sits next to you".`,
          relationships: `Hook examples: "Ren · Your rude CEO husband ignores you again", "Clingy girlfriend won't hang up", "Ex shows up in the pouring rain", "Cold fiancé locked in an arranged marriage", "Jealous boyfriend reads your texts".`,
          others: `Hook examples: "Kaien · Mafia boss makes you his secret lover", "Bodyguard off duty in your hotel room", "Vampire roommate wakes up thirsty", "Rude stranger buys you a drink", "Bad boy bully who secretly loves you".`,
        };
        const hint = categoryHints[catKey] ?? `Hook examples: "Alex · Rude roommate locks you out", "Cold coworker stays late with you", "Mysterious stranger offers you a ride home".`;

        const modeInstruction =
          mode === "scenario"
            ? `Output a SCENARIO hook (5-10 words, sentence case, no period) — describe what's happening in a juicy, cinematic way. Examples: "Your rude CEO husband ignores you again", "Bad boy bully who secretly loves you", "Mafia boss makes you his secret lover". No personal name.`
            : mode === "label"
              ? `Output a RELATIONSHIP + TRAIT hook (3-8 words, sentence case, no period). Must include a relationship word + a personality trait or twist. Examples: "Overprotective mafia older brother", "Clingy yandere girlfriend", "Cold arranged-marriage husband". No plain name.`
              : mode === "name"
                ? `Output NAME · short hook (format: "Firstname · lowercase hook, 4-8 words"). Examples: "Kaito · your rude college bestie", "Elena · jealous girlfriend on video call", "Vex · vampire roommate wakes up thirsty". The name must fit the character's vibe.`
                : `Pick ONE format at random, weighted like Chai / Swerve AI character cards:
- ~55% NAME · HOOK (format: "Firstname · lowercase juicy hook, 4-8 words") — e.g. "Ren · your rude CEO husband ignores you", "Kaito · bad boy bully who loves you", "Aiko · overprotective big sister catches you sneaking out".
- ~35% SCENARIO hooks (5-10 words, sentence case) — e.g. "Your mafia fiancé finds your secret diary", "Bratty little sister steals your hoodie".
- ~10% RELATIONSHIP + TRAIT labels (3-6 words) — e.g. "Cold CEO fiancé", "Yandere childhood friend".`;

        const userContent: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        > = [
          {
            type: "text",
            text: `Study the character image and invent ONE juicy roleplay character title in the style of Chai AI and Swerve AI character cards — a hook that instantly makes someone want to tap and chat. Use vivid tropes: rude/cold/clingy/yandere/overprotective/jealous/flirty love interests, mafia bosses, CEOs, senpai, bullies who secretly love you, bratty siblings, forbidden romances, arranged marriages, roommates, vampires, bodyguards.
${modeInstruction}
Infer the character's relationship to the user, their personality trait, and the scenario from what you see in the image (outfit, setting, expression, mood). Fit category "${category ?? "General"}". ${hint}${
              description ? ` Extra context: ${description}.` : ""
            } Reply with ONLY the title text — no surrounding quotes, no trailing punctuation, no explanation, no "Name:" / "Scenario:" label, no markdown.`,
          },
        ];
        if (image) userContent.push({ type: "image_url", image_url: { url: image } });

        try {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content:
                    "You write character-card titles for an anime AI roleplay app in the exact style of Chai AI and Swerve AI: short, cinematic, trope-heavy hooks that read like a story pitch. Preferred format is 'Firstname · lowercase juicy hook' (e.g. 'Ren · your rude CEO husband ignores you'). Also mix in pure scenario hooks and trait labels. Length 3-10 words. Always fresh, never generic. Never add markdown, surrounding quotes, trailing punctuation, or labels — output only the title text.",
                },
                { role: "user", content: userContent },
              ],
              temperature: 1.15,
            }),
          });

          const rawText = await upstream.text();
          if (!upstream.ok) {
            const clientMsg =
              upstream.status === 429
                ? "AI service is busy. Please try again shortly."
                : upstream.status === 402
                  ? "AI credits exhausted. Please try again later."
                  : "AI generation failed. Please try again.";
            return new Response(JSON.stringify({ error: clientMsg }), {
              status: upstream.status,
              headers: { "Content-Type": "application/json" },
            });
          }
          const data = JSON.parse(rawText) as {
            choices?: { message?: { content?: string } }[];
          };
          const name = (data.choices?.[0]?.message?.content || "")
            .replace(/["'`*_]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .split("\n")[0]
            .slice(0, 90);

          return new Response(JSON.stringify({ name }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("[generate-name] Server error", error);
          return new Response(
            JSON.stringify({ error: "AI generation failed. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
