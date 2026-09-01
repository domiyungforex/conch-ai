import { NextRequest } from "next/server";
import { createAIProvider } from "@/lib/ai/provider";
import { THE_WAY_SYSTEM_PROMPT } from "@/lib/ai/system-prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, passage, audience, duration, type, style, purpose, notes } = body;

    if (!topic && !passage) {
      return Response.json({ error: "Topic or passage is required" }, { status: 400 });
    }

    const ai = createAIProvider();

    const sermonPrompt = `You are creating a professional sermon. Generate a complete sermon outline with full content for each section.

## Sermon Details
- Topic: ${topic || "General"}
- Main Passage: ${passage || "Not specified"}
- Type: ${type || "expository"}
- Duration: ${duration || "30"} minutes
- Audience: ${audience || "General congregation"}
- Style: ${style || "Conversational yet scholarly"}
- Purpose: ${purpose || "Teach and encourage"}
${notes ? `- Additional Notes: ${notes}` : ""}

## Response Format (JSON)
Return ONLY a valid JSON object with this structure:
{
  "title": "Sermon title",
  "mainText": "Main scripture reference",
  "bigIdea": "One-sentence big idea",
  "sections": [
    {
      "type": "introduction",
      "title": "Introduction",
      "content": "Full introduction content with engaging opening..."
    },
    {
      "type": "context",
      "title": "Context",
      "content": "Historical and literary context of the passage..."
    },
    {
      "type": "point_1",
      "title": "First Main Point",
      "content": "Full content for first point with Scripture support..."
    },
    {
      "type": "point_2",
      "title": "Second Main Point",
      "content": "Full content for second point..."
    },
    {
      "type": "point_3",
      "title": "Third Main Point",
      "content": "Full content for third point..."
    },
    {
      "type": "application",
      "title": "Application",
      "content": "Practical application for daily life..."
    },
    {
      "type": "conclusion",
      "title": "Conclusion",
      "content": "Powerful conclusion with call to action..."
    },
    {
      "type": "prayer",
      "title": "Closing Prayer",
      "content": "A prayer that ties the sermon together..."
    }
  ]
}

## Rules
- Every Scripture citation must be accurate (cite book, chapter, verse)
- Content should be substantial (not just bullet points)
- Application should be practical and actionable
- Tone should be ${style || "warm, scholarly, and encouraging"}
- Never claim divine revelation or speak for God directly
- Distinguish Scripture from interpretation
- Return ONLY the JSON, no other text`;

    const result = await ai.chat({
      messages: [
        { role: "system", content: THE_WAY_SYSTEM_PROMPT + "\n\nYou are generating sermon content. Return valid JSON only." },
        { role: "user", content: sermonPrompt },
      ],
      temperature: 0.7,
    });

    // Try to parse the JSON response
    let sermon;
    try {
      // Extract JSON from the response (it might be wrapped in markdown)
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sermon = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      // If JSON parsing fails, create a structured response from the text
      sermon = {
        title: topic || "Sermon",
        mainText: passage || "",
        bigIdea: "",
        sections: [
          { type: "introduction", title: "Introduction", content: result.content.substring(0, 1000) },
          { type: "point_1", title: "Main Content", content: result.content.substring(1000, 3000) || "Content generated based on your topic." },
          { type: "application", title: "Application", content: "Apply these truths to your daily life." },
          { type: "conclusion", title: "Conclusion", content: "May God bless you as you live out His Word." },
          { type: "prayer", title: "Closing Prayer", content: "Lord, help us to understand and apply Your Word. Amen." },
        ],
      };
    }

    // Add metadata
    sermon.metadata = {
      topic,
      passage,
      type,
      duration,
      audience,
      style,
      purpose,
      generatedAt: new Date().toISOString(),
    };

    return Response.json(sermon);
  } catch (error) {
    console.error("Sermon generation error:", error);
    return Response.json({ error: "Failed to generate sermon" }, { status: 500 });
  }
}
