import { NextResponse } from "next/server";
import { runProjectTestSuite } from "@/lib/aiTestingAgent";
import { db } from "@/config/db";
import { testRunsTable } from "@/config/schema";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
  FilesMapSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const RunTestingSchema = z.object({
  projectID: ProjectIdSchema.optional().nullable(),
  filesMap: FilesMapSchema,
});

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("Unauthorized. Please log in to run tests.", 401);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return safeErrorResponse("Invalid JSON payload.", 400);
    }

    const parseResult = RunTestingSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid input data.";
      return safeErrorResponse(firstError, 400);
    }

    const { projectID, filesMap } = parseResult.data;

    // Verify ownership of the project if projectID is provided
    if (projectID) {
      const isOwner = await verifyProjectOwnership(projectID, auth.userEmail);
      if (!isOwner) {
        return safeErrorResponse(
          "Forbidden: You do not have permission to run tests or record test runs for this project.",
          403
        );
      }
    }

    // Execute test suite
    const result = await runProjectTestSuite(filesMap);

    // Record test run in database if projectID is provided
    if (projectID) {
      try {
        await db.insert(testRunsTable).values({
          projectID: String(projectID),
          userEmail: auth.userEmail,
          scorePercent: result.scorePercent,
          totalTests: result.totalTests,
          passedTests: result.passedTests,
          failedTests: result.failedTests,
          categories: result.categories,
          issues: result.issues,
        });
      } catch (dbErr) {
        console.error("[TestingRun API] Failed to persist test run to database:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      testSuite: result,
    });
  } catch (error: unknown) {
    return safeErrorResponse("Internal server error while executing test suite.", 500, error);
  }
}
