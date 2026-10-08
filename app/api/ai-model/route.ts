// app/api/ai-model/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { ChatMessageItem } from "@/types/types";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const lastRequestByUser = new Map<string, number>();
const MIN_INTERVAL_MS = 2000; // 1 request per 2 seconds per user

function isRateLimited(userEmail: string): boolean {
  const now = Date.now();
  const last = lastRequestByUser.get(userEmail);
  if (last && now - last < MIN_INTERVAL_MS) {
    return true;
  }
  lastRequestByUser.set(userEmail, now);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    if (!GEMINI_KEY) {
      return NextResponse.json(
        { error: "Missing GEMINI_API_KEY in environment variables (.env.local)" },
        { status: 500 }
      );
    }

    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    if (isRateLimited(userEmail)) {
      return NextResponse.json(
        { error: "You're generating too fast. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    // 1. Transaction-safe atomic credit deduction
    // Ensures thread-safe check and decrement without race conditions
    const updatedUser = await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 1` })
      .where(and(eq(usersTable.email, userEmail), gte(usersTable.credits, 1)))
      .returning({ email: usersTable.email, remainingCredits: usersTable.credits });

    if (updatedUser.length === 0) {
      // Check if user exists at all or if credits were 0
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, userEmail))
        .limit(1);

      if (existingUser.length > 0 && (existingUser[0].credits ?? 0) <= 0) {
        return NextResponse.json(
          { error: "No credits remaining. Please upgrade your plan on the pricing page." },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const {
      messages,
      modelName = "gemini-3.5-flash",
      image,
      mode = "full",
      targetElement,
      currentFilesSummary,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing 'messages' array in request body" },
        { status: 400 }
      );
    }

    const isPatchMode = mode === "patch" || !!targetElement;

    const PATCH_SYSTEM_INSTRUCTION = `
You are a senior full-stack AI visual builder and code editor.
Modify the web application files precisely using targeted diff/patch operations.

OUTPUT FORMAT:
Return ONLY a valid JSON object wrapped inside a \`\`\`json ... \`\`\` markdown code fence matching this schema:

{
  "type": "patch",
  "summary": "Brief description of edits made",
  "operations": [
    {
      "op": "PATCH_FILE",
      "file": "index.html",
      "changes": [
        {
          "search": "<exact existing code to replace>",
          "replace": "<new replacement code>"
        }
      ]
    }
  ]
}

RULES:
1. 'search' MUST match a unique code fragment in the target file. Include surrounding context lines if needed for uniqueness.
2. Supported ops: 'PATCH_FILE', 'CREATE_FILE', 'DELETE_FILE', 'RENAME_FILE', 'UPDATE_FILE'.
3. If creating a new file, set "op": "CREATE_FILE" and provide "content".
4. If a full rebuild is necessary, set "type": "full" and provide a "files" object mapping paths to contents.
`;

    const FULL_SYSTEM_INSTRUCTION = `
You are a senior full-stack AI web developer and designer.
When generating or modifying a web application, generate complete, production-ready, clean, modern code split into logical files.

CRITICAL INSTRUCTIONS:
- Build ONLY the end-user application requested by the user (e.g. SaaS product, landing page, store).
- DEFAULT THEME & STYLING: Always design the website UI in a clean, modern, bright LIGHT THEME by default (light backgrounds like bg-white, bg-slate-50, text-slate-900, crisp light card containers) UNLESS the user explicitly requests Dark Mode in their prompt.
- DO NOT generate host IDE wrappers or prompt sidebars.
- Format every file using explicit file header tags:
--- FILE: path/to/file.ext ---

Example structure:
--- FILE: index.html ---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900">
...
</body>
</html>
`;

    const systemInstruction = isPatchMode ? PATCH_SYSTEM_INSTRUCTION : FULL_SYSTEM_INSTRUCTION;

    let userPrompt = messages.map((m: ChatMessageItem) => `${m.role || 'user'}: ${m.content || ''}`).join("\n");

    if (targetElement) {
      userPrompt += `\n\nTARGET VISUAL ELEMENT TO EDIT:\nTag: ${targetElement.tagName}\nSelector: ${targetElement.selector}\nCurrent Classes: ${targetElement.className}\nExisting Text/HTML: ${targetElement.innerHTML || targetElement.textContent}`;
    }

    if (currentFilesSummary) {
      userPrompt += `\n\nEXISTING APPLICATION FILES SUMMARY:\n${currentFilesSummary}`;
    }

    const fullPrompt = `${systemInstruction}\n\nUSER REQUEST:\n${userPrompt}`;

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);
    const parts: Part[] = [{ text: fullPrompt }];

    if (image && typeof image === "string" && image.startsWith("data:")) {
      const match = image.match(/^data:(.+);base64,(.+)$/);
      if (match) {
        const [, mimeType, base64Data] = match;
        parts.unshift({
          inlineData: { mimeType, data: base64Data },
        });
        parts.unshift({
          text: "The user attached a visual screenshot. Recreate or edit the UI elements to match it.",
        });
      }
    }

    const getModelFallbackList = (requested: string): string[] => {
      const activeWorkingModels = [
        "gemini-3.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.6-flash",
      ];
      const primary = activeWorkingModels.includes(requested) ? requested : "gemini-3.5-flash";
      return Array.from(new Set([primary, ...activeWorkingModels]));
    };

    const fallbackModels = getModelFallbackList(modelName || "gemini-3.5-flash");

    // 2. Real-time streaming generator
    let activeStream: AsyncIterable<any> | null = null;
    let selectedModelName = "";

    for (const currentModel of fallbackModels) {
      try {
        console.log(`[AI Stream] Initializing stream with model: ${currentModel}`);
        const model = genAI.getGenerativeModel({ model: currentModel });
        const streamResult = await model.generateContentStream({
          contents: [{ role: "user", parts }],
        });
        activeStream = streamResult.stream;
        selectedModelName = currentModel;
        break;
      } catch (err) {
        console.warn(`[AI Stream] Model ${currentModel} stream initiation failed:`, err);
      }
    }

    if (!activeStream) {
      // Refund credit if initialization failed completely
      if (updatedUser.length > 0) {
        await db
          .update(usersTable)
          .set({ credits: sql`${usersTable.credits} + 1` })
          .where(eq(usersTable.email, userEmail));
      }
      return NextResponse.json(
        { error: "AI service high traffic. Failed to initiate stream. Please try again." },
        { status: 503 }
      );
    }

    console.log(`[AI Stream] Streaming response started using model: ${selectedModelName}`);

    // Create ReadableStream from Gemini async iterable
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of activeStream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (streamError) {
          console.error("[AI Stream] Error during streaming:", streamError);
          controller.error(streamError);
        }
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: unknown) {
    console.error("Gemini Route error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
