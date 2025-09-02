// app/api/ai/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, content } = await req.json();

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Decide which model to use
    const useClaude = ["rqs", "hypotheses", "contributions", "critique", "spot_gaps", "synthesize_sources", "summarize"].includes(action);
    const useOpenAI = ["rewrite", "proofread", "shorten", "expand"].includes(action);

    let output = "";

    if (useClaude && anthropicKey) {
      // Claude (Anthropic)
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "content-type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 500,
          messages: [{ role: "user", content }]
        })
      });
      const data = await resp.json();
      output = data?.content?.[0]?.text || "Claude returned no text.";
    }

    else if (useOpenAI && openaiKey) {
      // OpenAI
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content }]
        })
      });
      const data = await resp.json();
      output = data?.choices?.[0]?.message?.content || "OpenAI returned no text.";
    }

    else {
      // Fallback if no key
      output = "⚠️ No API key set. Please add ANTHROPIC_API_KEY or OPENAI_API_KEY.";
    }

    return NextResponse.json({ result: output });

  } catch (err: any) {
    console.error("AI route error:", err);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
