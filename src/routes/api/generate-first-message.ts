import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/generate-first-message")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { name, description } = (await request.json()) as {
          name?: string;
          description?: string;
        };

        const key = process.env.DASHSCOPE_API_KEY;
        if (!key) {
          return new Response(
            JSON.stringify({ error: "Missing DASHSCOPE_API_KEY" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        try {
          const upstream = await fetch(
            "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${key}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "qwen-plus",
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
                temperature: 0.9,
              }),
            }
          );

          const rawText = await upstream.text();

          if (!upstream.ok) {
            return new Response(
              JSON.stringify({
                error: "Qwen request failed",
                status: upstream.status,
                details: rawText,
              }),
              {
                status: upstream.status,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const data = JSON.parse(rawText) as {
            choices?: { message?: { content?: string } }[];
          };

          const message = data.choices?.[0]?.message?.content?.trim() || "";

          return new Response(JSON.stringify({ message, debug: data }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: "Server error while calling Qwen",
              details: error instanceof Error ? error.message : String(error),
            }),
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