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
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const fullPrompt = `Cinematic anime illustration only. Studio-quality anime aesthetic with dramatic cinematic lighting, film-grade color grading, atmospheric depth, volumetric light, shallow depth of field, expressive eyes, clean cel-shaded lineart, vibrant yet moody palette, painterly backgrounds. Absolutely NO photorealism, NO 3D render, NO live-action, NO real photo. Character: ${prompt}`;

        const models = [
          "google/gemini-2.5-flash-image",
          "google/gemini-3.1-flash-image",
          "google/gemini-3.1-flash-lite-image",
        ];

        let lastStatus = 500;
        let lastError = "Image generation failed. Please try again.";

        for (const model of models) {
          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model,
              messages: [{ role: "user", content: fullPrompt }],
              modalities: ["image", "text"],
            }),
          });

          if (upstream.ok) {
            const data = (await upstream.json()) as {
              data?: Array<{ b64_json?: string }>;
            };
            const b64 = data.data?.[0]?.b64_json;
            if (b64) {
              return new Response(
                JSON.stringify({ image: `data:image/png;base64,${b64}` }),
                { headers: { "Content-Type": "application/json" } }
              );
            }
            lastStatus = 500;
            lastError = "Image generation failed. Please try again.";
            console.error("[generate-character-image] Empty response from", model);
            continue;
          }

          const text = await upstream.text();
          console.error("[generate-character-image] Upstream error", model, upstream.status, text);
          lastStatus = upstream.status;

          // Only fall back for capacity/credit/rate errors — not for 4xx validation issues
          if (upstream.status === 429) {
            lastError = "Rate limit reached. Please try again in a moment.";
            continue;
          }
          if (upstream.status === 402) {
            lastError = "AI credits exhausted. Please add credits in workspace settings.";
            continue;
          }
          if (upstream.status >= 500) {
            lastError = "Image generation failed. Please try again.";
            continue;
          }
          // Non-retryable — bail
          lastError = "Image generation failed. Please try again.";
          break;
        }

        return new Response(
          JSON.stringify({ error: lastError }),
          { status: lastStatus, headers: { "Content-Type": "application/json" } }
        );

      },
    },
  },
});
