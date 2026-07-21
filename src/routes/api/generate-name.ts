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
          family: "Scenarios: Overprotective Big Brother, Strict Mom Waiting Up, Bratty Little Sister, Cool Uncle Visiting, Grandma Sharing Old Photos, Family Packing for Vacation. Names: Aiko Tanaka, Ryo Nakamura, Mia Rivera.",
          friends: "Types/scenarios: College Friends Study Night, Mafia Friends Late Meetup, Childhood Friend Reappears, Rich Kid Best Friend, Gamer Friend Sleepover, Rude Friend Roasting You. Names: Kaito Mori, Jules Park, Sasha Lin.",
          group: "Types/scenarios: Mafia Crew at the Docks, Idol Group Backstage, Delinquent Gang Rooftop, Fantasy Adventuring Party, Band Rehearsal Fight. Names: The Crimson Six, Nightfall Crew, Team Ember.",
          school: "Types/scenarios: Rude Senpai After Class, Nerdy Classmate Tutoring, Delinquent Boyfriend Skipping Class, Student Council President Confronts Me, Transfer Student First Day. Names: Haru Sato, Rin Ikeda, Noa Fujimoto.",
          relationships: "Types/scenarios: Rude Boyfriend Ignoring You, Clingy Girlfriend Video Call, Ex Shows Up in the Rain, Cold CEO Fiancé, Long Distance Midnight Call, Jealous Boyfriend Late Night. Names: Ren Aoyama, Yuki Hoshino, Elena Cruz.",
          others: "Types/scenarios: Mafia Boss's Secret Lover, Bodyguard Off Duty, Rude Stranger at the Bar, Vampire Roommate Awakens, Late Night Hotel Encounter. Names: Kaien Kuroda, Vex, Selene Vale.",
        };
        const hint = categoryHints[catKey] ?? "Types/scenarios: Rude Roommate Locks Me Out, Cold Coworker Stays Late, Mysterious Stranger Offers a Ride. Names: Alex Voss, Mira Chen.";

        const modeInstruction =
          mode === "scenario"
            ? `Output a SCENARIO / SITUATION title (3-7 words, Title Case) — describe what's happening or about to happen. Examples: "Girlfriend Waiting on the Rooftop", "Little Sister Wants to Play", "Best Friend Sneaks Into My Room". Do NOT output a plain personal name.`
            : mode === "label"
              ? `Output a RELATIONSHIP + TRAIT label (2-6 words, Title Case). Examples: "Rude Boyfriend", "College Friends", "Mafia Friends Late Meetup", "Overprotective Big Brother", "Clingy Girlfriend", "Cold CEO Fiancé". Must include a relationship word. Do NOT output a plain personal name and do NOT describe an action.`
              : mode === "name"
                ? `Output a PERSONAL NAME only — a believable first + last name (or single stage name) fitting the character's vibe/ethnicity. Examples: "Kaito Mori", "Elena Cruz", "Vex". Do NOT include a scenario, action, or relationship word.`
                : `Pick ONE format at random, weighted:
- ~60% SCENARIO titles — e.g. "Girlfriend Waiting on the Rooftop", "Little Sister Wants to Play".
- ~25% RELATIONSHIP + TRAIT labels — e.g. "Rude Boyfriend", "College Friends Study Night", "Overprotective Big Brother".
- ~15% PERSONAL NAMES — e.g. "Kaito Mori", "Elena Cruz", "Vex".`;

        const userContent: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        > = [
          {
            type: "text",
            text: `Look at the image and invent ONE short roleplay title (2-7 words, Title Case) for this character.
${modeInstruction}
Infer relationship (friend, girlfriend, boyfriend, best friend, sister, brother, mom, dad, senpai, stranger, boss, roommate, etc.) and personality trait (rude, shy, clingy, cold, protective, flirty, bratty, cool, mysterious) from the image when useful. Fit category "${category ?? "General"}". ${hint}${
              description ? ` Extra context: ${description}.` : ""
            } Reply with ONLY the title — no quotes, no trailing punctuation, no explanation, no label like "Name:" or "Scenario:".`,
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
                    "You generate short roleplay character titles for an anime chat app. Mix three formats: scenario titles (what's happening), relationship+trait labels (e.g. 'Rude Boyfriend', 'College Friends', 'Mafia Friends'), and occasional plain personal names. 2-7 words, Title Case. Vary format each call. Never add markdown, quotes, labels, or commentary — output only the title text.",
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
            .slice(0, 60);

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
