import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { testRunsTable } from "@/config/schema";
import { eq, desc } from "drizzle-orm";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
} from "@/lib/authSecurity";

export async function GET(req: Request) {
  try {
    const authData = await getAuthenticatedUser();
    if (!authData) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    const { userEmail } = authData;

    const { searchParams } = new URL(req.url);
    const rawProjectId = searchParams.get("projectID") || "";

    const projectIdResult = ProjectIdSchema.safeParse(rawProjectId);
    if (!projectIdResult.success) {
      return NextResponse.json(
        { error: "Valid 'projectID' query parameter is required." },
        { status: 400 }
      );
    }
    const projectID = projectIdResult.data;

    // Verify user owns the project before returning testing history
    const isOwner = await verifyProjectOwnership(projectID, userEmail);
    if (!isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to view test history for this project." },
        { status: 403 }
      );
    }

    const history = await db
      .select()
      .from(testRunsTable)
      .where(eq(testRunsTable.projectID, projectID))
      .orderBy(desc(testRunsTable.createdOn))
      .limit(20);

    return NextResponse.json({
      success: true,
      history,
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to fetch test history", 500, error);
  }
}
