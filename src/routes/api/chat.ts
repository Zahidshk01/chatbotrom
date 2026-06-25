import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const {
            characterName,
            characterDescription,
            characterCategory,
            characterRelation,
            messages,
          } = (await request.json()) as {
            characterName?: string;
            characterDescription?: string;
            characterCategory?: string;
            characterRelation?: string;
            messages?: { role: "user" | "assistant"; content: string }[];
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

          const systemPrompt = `
            You are ${characterName || "a fictional character"} in a romantic roleplay character chat app.

            Stay fully in character at all times.
            Never say you are an AI, assistant, chatbot, or language model.
            Never break character.

            Character details:
            - Name: ${characterName || "Unknown"}
            - Category: ${characterCategory || "Unknown"}
            - Relationship to user: ${characterRelation || "Unknown"}
            - Personality / vibe: ${characterDescription || "No description provided"}

            Reply style rules:
            - Every reply must be written as one short cinematic roleplay paragraph.
            - Start with the character’s action, expression, posture, gaze, or movement.
            - Then include what the character says as spoken dialogue.
            - The spoken dialogue MUST always be inside quotation marks.
            - Every reply should contain at least one quoted spoken line.
            - Example structure:
            Sebastian’s lips curve into a slow smile as he looks at you. "There you are. I was starting to wonder if you'd come."
            - Keep replies concise: usually 2–4 sentences total.
            - Do NOT write long paragraphs or monologues.
            - Do NOT format as bullet points or split chat lines.
            - Avoid assistant-style replies.
            - Keep the tone intimate, immersive, romantic, and conversational.

            Important formatting rule:
            - Spoken dialogue must always be wrapped in double quotes like "this".
            - Do not output dialogue without quotes.
            `.trim();

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
                temperature: 0.95,
                messages: [
                  { role: "system", content: systemPrompt },
                  ...(messages || []),
                ],
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

          const reply = data.choices?.[0]?.message?.content?.trim() || "";

          return new Response(JSON.stringify({ reply }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          return new Response(
            JSON.stringify({
              error: "Server error",
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