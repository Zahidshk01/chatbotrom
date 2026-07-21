import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  image: z.string().trim().min(1).max(15_000_000).optional(),
  description: z.string().trim().max(1000).optional(),
  category: z.string().trim().max(60).optional(),
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
        const { image, description, category } = parsed.data;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "AI generation is not configured." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const catKey = (category || "").toLowerCase();
        const categoryHints: Record<string, string> = {
          family: "Examples: Family on Vacation, Family Having Dinner, Sunday Morning Pancakes, Backyard BBQ Day, Movie Night with Family, Road Trip Memories, Grandma's Birthday, Cozy Winter Evening.",
          friends: "Examples: Best Friends Sleepover, Late Night Coffee Run, Beach Day With Friends, Rooftop Hangout, Study Session Chaos, Karaoke Night Out.",
          group: "Examples: Squad on Tour, Rival Gang Meetup, Adventuring Party, Rooftop Crew, Weekend Getaway Group.",
          school: "Examples: After School Rooftop, Library Study Buddy, Class President Drama, Rainy Day Classroom, Cultural Festival Prep, Cherry Blossom Walk Home.",
          relationships: "Examples: First Date Café, Rainy Umbrella Moment, Late Night Confession, Anniversary Dinner, Long Distance Reunion.",
          others: "Examples: Midnight Encounter, Forbidden Rendezvous, Silk & Shadows, After Hours Suite.",
        };
        const hint = categoryHints[catKey] ?? "Examples: Quiet Afternoon, Neon City Night, Rainy Rooftop Moment.";

        const userContent: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        > = [
          {
            type: "text",
            text: `Look at the image and invent a short evocative TITLE (2-5 words, Title Case) that describes the SCENE / VIBE / MOMENT shown — not a personal name. It should fit the category "${category ?? "General"}". ${hint}${
              description ? ` Extra vibe: ${description}.` : ""
            } Reply with ONLY the title — no quotes, no punctuation at the end, no explanation.`,
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
                    "You title anime/roleplay scenes. Output just a short scene title (2-5 words, Title Case) describing the moment/vibe shown — no personal names unless clearly a solo portrait, no markdown, no quotes, no commentary.",
                },
                { role: "user", content: userContent },
              ],
              temperature: 1,
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
