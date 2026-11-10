import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { frameTable } from "@/config/schema";
import { eq, asc } from "drizzle-orm";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
} from "@/lib/authSecurity";

// GET /api/frame/list?projectId=... — list all versions/frames for an authenticated user's project
export async function GET(request: NextRequest) {
  try {
    const authData = await getAuthenticatedUser();
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const { userEmail } = authData;

    const searchParams = request.nextUrl.searchParams;
    const rawProjectId = searchParams.get("projectId") || "";

    const projectIdResult = ProjectIdSchema.safeParse(rawProjectId);
    if (!projectIdResult.success) {
      return NextResponse.json(
        { error: "Valid 'projectId' query parameter is required" },
        { status: 400 }
      );
    }
    const projectId = projectIdResult.data;

    // Verify user owns the project
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view frames for this project." },
        { status: 403 }
      );
    }

    const frames = await db
      .select({
        frameID: frameTable.frameID,
        createdOn: frameTable.createdOn,
      })
      .from(frameTable)
      .where(eq(frameTable.projectID, projectId))
      .orderBy(asc(frameTable.createdOn));

    return NextResponse.json({ frames });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to list versions", 500, error);
  }
}
