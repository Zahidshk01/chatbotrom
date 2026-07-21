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
          family: "Examples: Mom Cooking Sunday Dinner, Dad Teaching Me to Drive, Little Sister Wants to Play, Big Brother Home from College, Grandma Sharing Old Photos, Family Packing for Vacation.",
          friends: "Examples: Best Friend Sneaks Into My Room, Friends Planning a Road Trip, Bestie Crying After a Breakup, Friend Dares Me at 2AM, Childhood Friend Reappears.",
          group: "Examples: Squad Planning a Heist, Band Rehearsing Before the Show, Rival Gang Blocks the Alley, Study Group Pulls an All-Nighter.",
          school: "Examples: Classmate Passes Me a Note, Senpai Waits After Class, Student Council President Confronts Me, Rainy Walk Home With Rival, Library Tutor Session.",
          relationships: "Examples: Girlfriend Waiting on the Rooftop, Boyfriend Surprises Me at Work, Long Distance Video Call at Midnight, First Date Nervous Café Meetup, Ex Shows Up in the Rain.",
          others: "Examples: Mysterious Stranger in a Hotel Bar, Late Night Rooftop Confession, Forbidden Rendezvous Backstage, Bodyguard Off Duty.",
        };
        const hint = categoryHints[catKey] ?? "Examples: Roommate Locks Me Out, Stranger Offers a Ride Home, Coworker Stays Late With Me.";

        const userContent: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        > = [
          {
            type: "text",
            text: `Look at the image and invent a short SCENARIO TITLE (3-7 words, Title Case) describing what's happening — what the character(s) are doing right now or about to do — like a roleplay chapter title. It should read like a situation (e.g. "Girlfriend Waiting on the Rooftop", "Little Sister Wants to Play", "Best Friend Sneaks Into My Room"), NOT a personal name and NOT just a vibe/aesthetic phrase. Infer the relationship (friend, girlfriend, boyfriend, best friend, sister, brother, mom, dad, senpai, stranger, etc.) from the image when possible. It should fit the category "${category ?? "General"}". ${hint}${
              description ? ` Extra context: ${description}.` : ""
            } Reply with ONLY the scenario title — no quotes, no trailing punctuation, no explanation.`,
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
                    "You write short roleplay SCENARIO titles (3-7 words, Title Case). Every title must describe a situation — who the character is to the user (friend, girlfriend, boyfriend, best friend, sister, brother, mom, dad, senpai, stranger, etc.) plus what they are doing or about to do. Never output a bare personal name. Never output a pure aesthetic/vibe phrase without an action or relationship. No markdown, no quotes, no commentary — just the title.",
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
