import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { frameTable, chatTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
  FrameIdSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const CreateFrameSchema = z.object({
  projectId: ProjectIdSchema,
  startingCode: z.string().max(5 * 1024 * 1024, "Code payload exceeds 5MB limit").optional(),
});

const UpdateFrameSchema = z.object({
  frameId: FrameIdSchema,
  projectId: ProjectIdSchema,
  designCode: z.string().max(5 * 1024 * 1024, "Code payload exceeds 5MB limit"),
});

// POST /api/frame — create a new version/frame inside an existing project.
export async function POST(request: NextRequest) {
  try {
    const authData = await getAuthenticatedUser();
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const { userEmail } = authData;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = CreateFrameSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { projectId, startingCode } = parseResult.data;

    // Verify project ownership
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to add frames to this project." },
        { status: 403 }
      );
    }

    const newFrameId = `frame-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(frameTable).values({
      frameID: newFrameId,
      projectID: projectId,
      designCode: startingCode ?? "",
    });

    return NextResponse.json({ frameId: newFrameId });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to create new version", 500, error);
  }
}

// GET /api/frame?frameId=...&projectId=... — fetch specific frame and its chat history
export async function GET(request: NextRequest) {
  try {
    const authData = await getAuthenticatedUser();
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const { userEmail } = authData;

    const searchParams = request.nextUrl.searchParams;
    const rawFrameId = searchParams.get("frameId") || "";
    const rawProjectId = searchParams.get("projectId") || "";

    const frameIdResult = FrameIdSchema.safeParse(rawFrameId);
    const projectIdResult = ProjectIdSchema.safeParse(rawProjectId);

    if (!frameIdResult.success || !projectIdResult.success) {
      return NextResponse.json(
        { error: "Valid 'frameId' and 'projectId' query parameters are required" },
        { status: 400 }
      );
    }

    const frameId = frameIdResult.data;
    const projectId = projectIdResult.data;

    // Verify user owns the project this frame belongs to
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to access this project's frame." },
        { status: 403 }
      );
    }

    const frame = await db
      .select()
      .from(frameTable)
      .where(
        and(
          eq(frameTable.frameID, frameId),
          eq(frameTable.projectID, projectId)
        )
      )
      .limit(1);

    if (frame.length === 0) {
      return NextResponse.json({ error: "Frame not found" }, { status: 404 });
    }

    const chats = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.frameID, frameId));

    let chatMessages = [];
    if (chats.length > 0) {
      const firstChat = chats[0].ChatMessage;
      if (Array.isArray(firstChat)) {
        chatMessages = firstChat;
      } else {
        chatMessages = chats.map((chat) => chat.ChatMessage).filter(Boolean);
      }
    }

    return NextResponse.json({
      ...frame[0],
      chatMessages,
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to fetch frame", 500, error);
  }
}

// PUT /api/frame — update design code for a specific frame
export async function PUT(request: NextRequest) {
  try {
    const authData = await getAuthenticatedUser();
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const { userEmail } = authData;

    const rawBody = await request.json().catch(() => ({}));
    const parseResult = UpdateFrameSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { frameId, projectId, designCode } = parseResult.data;

    // Verify user owns the project this frame belongs to
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to modify this project." },
        { status: 403 }
      );
    }

    const updateRes = await db
      .update(frameTable)
      .set({ designCode })
      .where(
        and(
          eq(frameTable.frameID, frameId),
          eq(frameTable.projectID, projectId)
        )
      )
      .returning({ frameID: frameTable.frameID });

    if (updateRes.length === 0) {
      return NextResponse.json({ error: "Frame not found for this project." }, { status: 404 });
    }

    return NextResponse.json({ result: "updated" });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to update frame", 500, error);
  }
}
