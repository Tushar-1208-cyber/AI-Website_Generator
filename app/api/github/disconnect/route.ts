// app/api/github/disconnect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import {
  githubAccountsTable,
  projectGitHubRepositoriesTable,
} from "@/config/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const body = await req.json().catch(() => ({}));
    const { projectId, action = "unlink_project" } = body;

    if (action === "disconnect_account") {
      await db
        .delete(githubAccountsTable)
        .where(eq(githubAccountsTable.userEmail, userEmail));

      if (projectId) {
        await db
          .delete(projectGitHubRepositoriesTable)
          .where(
            and(
              eq(projectGitHubRepositoriesTable.projectID, projectId),
              eq(projectGitHubRepositoriesTable.userEmail, userEmail)
            )
          );
      }

      return NextResponse.json({
        success: true,
        message: "Disconnected GitHub account. Your GitHub repositories remain intact on GitHub.",
      });
    }

    if (projectId) {
      await db
        .delete(projectGitHubRepositoriesTable)
        .where(
          and(
            eq(projectGitHubRepositoriesTable.projectID, projectId),
            eq(projectGitHubRepositoriesTable.userEmail, userEmail)
          )
        );

      return NextResponse.json({
        success: true,
        message: "Unlinked repository from project. The repository remains on GitHub.",
      });
    }

    return NextResponse.json({ error: "Invalid action or missing projectId" }, { status: 400 });
  } catch (error: unknown) {
    console.error("GitHub Disconnect API error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
