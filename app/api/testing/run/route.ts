import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { runProjectTestSuite } from "@/lib/aiTestingAgent";
import { db } from "@/config/db";
import { testRunsTable } from "@/config/schema";

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress || null;

    const body = await req.json();
    const { projectID, filesMap } = body;

    if (!filesMap || typeof filesMap !== "object") {
      return NextResponse.json(
        { error: "filesMap parameter is required." },
        { status: 400 }
      );
    }

    // Execute test suite
    const result = await runProjectTestSuite(filesMap);

    // Record test run in database if projectID is provided
    if (projectID) {
      try {
        await db.insert(testRunsTable).values({
          projectID: String(projectID),
          userEmail,
          scorePercent: result.scorePercent,
          totalTests: result.totalTests,
          passedTests: result.passedTests,
          failedTests: result.failedTests,
          categories: result.categories,
          issues: result.issues,
        });
      } catch (dbErr) {
        console.error("Failed to persist test run to database:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      testSuite: result,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
