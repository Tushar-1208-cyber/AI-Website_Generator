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

    const userPrompt = messages.map((m: ChatMessageItem) => `${m.role || 'user'}: ${m.content || ''}`).join("\n");

    const requestedModel = (modelName && modelName.startsWith("gemini-")) ? modelName : "gemini-3.6-flash";

    const genAI = new GoogleGenerativeAI(GEMINI_KEY);

    const parts: Part[] = [{ text: userPrompt }];

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
