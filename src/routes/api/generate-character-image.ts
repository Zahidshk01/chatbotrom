import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  prompt: z.string().trim().min(1).max(1000),
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

export const Route = createFileRoute("/api/generate-character-image")({
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
          return new Response(
            JSON.stringify({ error: "Prompt required (max 1000 chars)" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        const { prompt } = parsed.data;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          console.error("[generate-character-image] Missing LOVABLE_API_KEY");
          return new Response(
            JSON.stringify({ error: "AI generation is not configured." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const fullPrompt = `Anime-style character portrait, vibrant colors, cel-shaded, high detail, expressive eyes, clean lineart, studio anime aesthetic. Subject: ${prompt}`;

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/images/generations",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3.1-flash-image-preview",
              messages: [{ role: "user", content: fullPrompt }],
              modalities: ["image", "text"],
            }),
          },
        );

        if (!upstream.ok) {
          const text = await upstream.text();
          console.error(
            "[generate-character-image] Upstream error",
            upstream.status,
            text
          );
          const clientMsg =
            upstream.status === 429
              ? "AI service is busy. Please try again shortly."
              : upstream.status === 402
                ? "AI credits exhausted. Please try again later."
                : "Image generation failed. Please try again.";
          return new Response(JSON.stringify({ error: clientMsg }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }
        const data = (await upstream.json()) as {
          data?: { b64_json?: string }[];
        };
        const b64 = data.data?.[0]?.b64_json;
        if (!b64) {
          console.error("[generate-character-image] No image returned");
          return new Response(
            JSON.stringify({ error: "Image generation failed. Please try again." }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
        return new Response(
          JSON.stringify({ image: `data:image/png;base64,${b64}` }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
