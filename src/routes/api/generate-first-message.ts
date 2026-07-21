import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  name: z.string().trim().max(200).optional(),
  description: z.string().trim().max(1000).optional(),
  image: z.string().trim().max(2_000_000).optional(),
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

export const Route = createFileRoute("/api/generate-first-message")({
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
        const { name, description, image } = parsed.data;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          console.error("[generate-first-message] Missing LOVABLE_API_KEY");
          return new Response(
            JSON.stringify({ error: "AI generation is not configured." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const userContent: Array<
          | { type: "text"; text: string }
          | { type: "image_url"; image_url: { url: string } }
        > = [
          {
            type: "text",
            text: `Write the first message for a character named "${name || "the character"}"${
              description ? ` (vibe / look: ${description})` : ""
            }. Base the scene, appearance and tone on the attached character image — describe what you can see (outfit, setting, mood, expression). Set a short scene, then have them speak one short line in single quotes.`,
          },
        ];
        if (image) userContent.push({ type: "image_url", image_url: { url: image } });

        try {
          const upstream = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
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
                      "You write cinematic, immersive opening lines for AI chat characters in a roleplay app. Always 2–4 sentences, present tense, vivid sensory detail grounded in the provided image, ending with the character speaking one short line in single quotes. Never break character. Never use markdown.",
                  },
                  { role: "user", content: userContent },
                ],
                temperature: 0.9,
              }),
            }
          );

          const rawText = await upstream.text();

          if (!upstream.ok) {
            console.error(
              "[generate-first-message] Upstream error",
              upstream.status,
              rawText
            );
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

          const message = data.choices?.[0]?.message?.content?.trim() || "";

          return new Response(JSON.stringify({ message }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("[generate-first-message] Server error", error);
          return new Response(
            JSON.stringify({ error: "AI generation failed. Please try again." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
