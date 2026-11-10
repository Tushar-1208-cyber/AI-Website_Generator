import { db } from "@/config/db";
import { chatTable } from "@/config/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  getAuthenticatedUser,
  verifyFrameOwnership,
  safeErrorResponse,
  FrameIdSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const ChatsPayloadSchema = z.object({
  frameId: FrameIdSchema,
  messages: z.array(z.any()).max(500, "Maximum message history limit exceeded"),
});

export async function POST(req: NextRequest) {
  try {
    const authData = await getAuthenticatedUser();
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const { userEmail } = authData;

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = ChatsPayloadSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { frameId, messages } = parseResult.data;

    // Verify user owns the frame's project before modifying chat records
    const { isOwner } = await verifyFrameOwnership(frameId, userEmail);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify chats for this frame." },
        { status: 403 }
      );
    }

    // Delete existing chat messages for this frame
    await db.delete(chatTable).where(eq(chatTable.frameID, frameId));

    // Insert updated messages
    await db.insert(chatTable).values({
      ChatMessage: messages,
      frameID: frameId,
      createdBy: userEmail,
    });

    return NextResponse.json({
      result: "updated",
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to update chats", 500, error);
  }
}
