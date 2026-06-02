import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-first-message")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { name, description } = (await request.json()) as {
          name?: string;
          description?: string;
        };
        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const upstream = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-3-flash-preview",
              messages: [
                {
                  role: "system",
                  content:
                    "You write cinematic, immersive opening lines for AI chat characters in a roleplay app. Always 2–4 sentences, present tense, vivid sensory detail, ending with the character speaking one short line in single quotes. Never break character. Never use markdown.",
                },
                {
                  role: "user",
                  content: `Write the first message for a character named "${name || "the character"}". ${
                    description ? `Vibe / look: ${description}.` : ""
                  } Set a short scene, then have them speak.`,
                },
              ],
            }),
          },
        );

        if (!upstream.ok) {
          const text = await upstream.text();
          return new Response(JSON.stringify({ error: text || "Generation failed" }), {
            status: upstream.status,
            headers: { "Content-Type": "application/json" },
          });
        }
        const data = (await upstream.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const message = data.choices?.[0]?.message?.content?.trim() || "";
        return new Response(JSON.stringify({ message }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
