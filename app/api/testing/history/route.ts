import { NextResponse } from "next/server";
import { db } from "@/config/db";
import { testRunsTable } from "@/config/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectID = searchParams.get("projectID");

    if (!projectID) {
      return NextResponse.json(
        { error: "projectID query parameter is required." },
        { status: 400 }
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
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
