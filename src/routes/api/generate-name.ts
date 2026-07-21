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
          family: `Examples: "Ryo (overprotective big brother)", "Mika (strict mom who waited up)", "Yuna (bratty little sister)", "Kenji (dad's best friend)".`,
          friends: `Examples: "Kaito (college bestie with a crush)", "Rei (mafia friend in trouble)", "Sana (childhood friend returning)", "Leo (rich kid bestie)".`,
          group: `Examples: "The Crimson Six (mafia crew you owe)", "Nova (idol group leader backstage)", "Riot (delinquent gang on the rooftop)".`,
          school: `Examples: "Haru (rude senpai after class)", "Aki (nerdy classmate tutoring you)", "Sora (delinquent boyfriend skipping class)", "Yuki (student council president)".`,
          relationships: `Examples: "Ren (rude CEO husband)", "Mina (clingy girlfriend)", "Kai (ex in the pouring rain)", "Elena (jealous girlfriend on video call)", "Zeth (cold distant singer boyfriend)".`,
          others: `Examples: "Kaien (mafia boss secret lover)", "Vex (thirsty vampire roommate)", "Dante (off-duty bodyguard)", "Rin (bad boy bully who loves you)".`,
        };
        const hint = categoryHints[catKey] ?? `Examples: "Alex (rude roommate)", "Nico (cold coworker staying late)", "Ash (mysterious stranger offering a ride)".`;

        const modeInstruction = `Output format is STRICT: "Firstname (lowercase descriptor in parentheses)".
The descriptor in parentheses must be 2-6 words describing ONE of: the relationship to the user, the character's personality/trait, their current mood, or what they're thinking/wanting right now. Sentence case inside parens, no period.
Good: "Helena (shy girlfriend)", "Zeth (cold distant singer boyfriend)", "Julia (ex girlfriend)", "Evelyn (cold old-money heiress)", "Selena (your ex girlfriend)", "Bianca (annoyed goth roommate)", "Ren (rude CEO husband ignoring you)", "Aiko (overprotective big sister)", "Kai (jealous boyfriend reading your texts)".
Bad: bare names, missing parentheses, long sentences, trailing punctuation, quotes around the whole title.`;

        const userContent: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        > = [
          {
            type: "text",
            text: `Study the character image and invent ONE juicy roleplay character title in the style of Chai AI and Swerve AI character cards.
${modeInstruction}
Pick a first name that fits the character's vibe (outfit, setting, expression, mood, ethnicity cues). Use vivid tropes for the parenthesized descriptor: rude/cold/clingy/yandere/overprotective/jealous/flirty, mafia bosses, CEOs, senpai, bullies who secretly love you, bratty siblings, roommates, vampires, bodyguards, exes.
Fit category "${category ?? "General"}". ${hint}${
              description ? ` Extra context: ${description}.` : ""
            } Reply with ONLY the title text in the exact format Name (descriptor) — no surrounding quotes, no trailing punctuation, no explanation, no labels, no markdown.`,
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
                    "You write character-card titles for an anime AI roleplay app. STRICT output format: 'Firstname (lowercase descriptor)' — where the descriptor in parentheses is 2-6 words describing the character's relationship to the user, their personality/trait, mood, or what they want. Examples: 'Helena (shy girlfriend)', 'Zeth (cold distant singer boyfriend)', 'Ren (rude CEO husband)', 'Bianca (annoyed goth roommate)'. Never output a bare name. Never wrap the whole title in quotes. Never add markdown or trailing punctuation. Always fresh, cinematic, trope-heavy.",
                },
                { role: "user", content: userContent },
              ],
              temperature: 1.1,
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
