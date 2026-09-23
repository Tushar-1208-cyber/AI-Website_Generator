// app/api/ai-model/route.ts
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import { ChatMessageItem } from "@/types/types";

const GEMINI_KEY = process.env.GEMINI_API_KEY;

const lastRequestByUser = new Map<string, number>();
const MIN_INTERVAL_MS = 3000; // 1 generation per 3 seconds per user

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
        { error: "You're generating too fast. Please wait a few seconds and try again." },
        { status: 429 }
      );
    }

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    if (existingUser.length > 0) {
      const credits = existingUser[0].credits ?? 0;
      if (credits <= 0) {
        return NextResponse.json(
          { error: "No credits remaining. Please upgrade your plan in pricing page." },
          { status: 403 }
        );
      }
    }

    const { messages, modelName = "gemini-3.6-flash", image } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing 'messages' array in request body" },
        { status: 400 }
      );
    }

    const SYSTEM_INSTRUCTION = `
You are a senior full-stack AI web developer and designer.
When generating or modifying a web application, generate complete, production-ready, clean, modern code split into logical files.

CRITICAL FORMATTING INSTRUCTIONS:
- You MUST format every file in the project using explicit file header tags:
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
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
...
<script src="js/app.js"></script>
</body>
</html>

--- FILE: css/styles.css ---
/* Custom styling */

--- FILE: js/app.js ---
// Interactive JavaScript logic

RULES:
1. Always include a primary 'index.html' file.
2. Separate CSS into stylesheet files (e.g., 'css/styles.css' or Tailwind CDN + custom CSS).
3. Separate JS into script files (e.g., 'js/app.js').
4. Include backend/API server code (e.g., 'server.js' or 'api/routes.js') if full-stack backend functionality is requested.
5. Provide COMPLETE code for all files without placeholders or truncated code.
6. Do NOT wrap output in single markdown code fences around the entire project; use '--- FILE: path ---' markers.
7. IMAGES: Use real high-resolution Unsplash image URLs (e.g., https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80 for tech, https://images.unsplash.com/photo-1523275335684-37898b6baf30 for product, https://images.unsplash.com/photo-1517248135467-4c7edcad34c4 for food/cafe, https://images.unsplash.com/photo-1534528741775-53994a69daeb for avatar). Never use grey placehold.co images.
8. MULTI-PAGE WEBSITES: When creating full websites, generate separate HTML files for pages (e.g., 'index.html', 'about.html', 'services.html', 'contact.html') with working links (<a href="about.html">).
`;

    const userPrompt = messages.map((m: ChatMessageItem) => `${m.role || 'user'}: ${m.content || ''}`).join("\n");
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nUSER REQUEST:\n${userPrompt}`;

    const requestedModel = (modelName && modelName.startsWith("gemini-")) ? modelName : "gemini-3.6-flash";

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
          text: "The user attached an image of a design/screenshot. Recreate it as closely as possible using the instructions below.",
        });
      }
    }

    // Active working models on Gemini v1beta API: gemini-3.6-flash and gemini-3.5-flash-lite
    const fallbackModels = Array.from(
      new Set([requestedModel, "gemini-3.6-flash", "gemini-3.5-flash-lite"])
    );

    let generatedText = "";
    let lastError: unknown = null;

    for (const currentModel of fallbackModels) {
      try {
        const model = genAI.getGenerativeModel({ model: currentModel });
        const result = await model.generateContent({
          contents: [{ role: "user", parts }],
        });
        generatedText = result.response.text();
        if (generatedText) {
          console.log(`[AI Generation] Successfully generated output using model: ${currentModel}`);
          break;
        }
      } catch (err: unknown) {
        lastError = err;
        console.warn(`[AI Generation] Model ${currentModel} failed. Trying next fallback...`);
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (!generatedText && lastError) {
      throw lastError;
    }

    if (existingUser.length > 0) {
      const currentCredits = existingUser[0].credits ?? 0;
      await db
        .update(usersTable)
        .set({ credits: Math.max(0, currentCredits - 1) })
        .where(eq(usersTable.email, userEmail));
    }

    return new Response(generatedText, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("Gemini API error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: errMessage },
      { status: 500 }
    );
  }
}
