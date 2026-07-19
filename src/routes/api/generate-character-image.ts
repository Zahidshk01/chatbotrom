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

        const key = process.env.MODELSLAB_API_KEY;
        if (!key) {
          console.error("[generate-character-image] Missing MODELSLAB_API_KEY");
          return new Response(
            JSON.stringify({ error: "AI generation is not configured." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const fullPrompt = `anime-style character portrait, vibrant colors, cel-shaded, high detail, expressive eyes, clean lineart, studio anime aesthetic, ${prompt}`;

        const upstream = await fetch("https://modelslab.com/api/v3/dreambooth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key,
            model_id: "anything-v5",
            prompt: fullPrompt,
            negative_prompt: "lowres, bad anatomy, bad hands, blurry, worst quality",
            width: "512",
            height: "512",
            samples: "1",
            num_inference_steps: "30",
            guidance_scale: 7.5,
            safety_checker: "yes",
            enhance_prompt: "yes",
          }),
        });

        if (!upstream.ok) {
          const text = await upstream.text();
          console.error("[generate-character-image] Upstream error", upstream.status, text);
          return new Response(
            JSON.stringify({ error: "Image generation failed. Please try again." }),
            { status: upstream.status, headers: { "Content-Type": "application/json" } }
          );
        }

        const data = (await upstream.json()) as {
          status?: string;
          output?: string[];
          future_links?: string[];
          message?: string;
          messege?: string;
        };

        if (data.status === "error") {
          console.error("[generate-character-image] ModelsLab error", data);
          const msg = data.message || data.messege || "Image generation failed.";
          return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const url = data.output?.[0] || data.future_links?.[0];
        if (!url) {
          console.error("[generate-character-image] No image returned", data);
          return new Response(
            JSON.stringify({ error: "Image generation failed. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ image: url }), {
          headers: { "Content-Type": "application/json" },
        });

        }

        const data = (await upstream.json()) as {
          images?: { url?: string }[];
        };
        const url = data.images?.[0]?.url;
        if (!url) {
          console.error("[generate-character-image] No image returned");
          return new Response(
            JSON.stringify({ error: "Image generation failed. Please try again." }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ image: url }), {
          headers: { "Content-Type": "application/json" },
        });


      },
    },
  },
});
