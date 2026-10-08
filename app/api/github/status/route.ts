// app/api/github/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { githubAccountsTable, projectGitHubRepositoriesTable, projectsTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    // Fetch GitHub Account Connection
    const githubAccountRecords = await db
      .select()
      .from(githubAccountsTable)
      .where(eq(githubAccountsTable.userEmail, userEmail))
      .limit(1);

    const isConnected = githubAccountRecords.length > 0;
    const accountInfo = isConnected
      ? {
          username: githubAccountRecords[0].username,
          avatarUrl: githubAccountRecords[0].avatarUrl,
        }
      : null;

    let repoInfo: any = null;

    if (projectId) {
      const repoRecords = await db
        .select()
        .from(projectGitHubRepositoriesTable)
        .where(
          and(
            eq(projectGitHubRepositoriesTable.projectID, projectId),
            eq(projectGitHubRepositoriesTable.userEmail, userEmail)
          )
        )
        .limit(1);

      if (repoRecords.length > 0) {
        repoInfo = {
          owner: repoRecords[0].owner,
          repoName: repoRecords[0].repoName,
          branch: repoRecords[0].branch,
          isPrivate: Boolean(repoRecords[0].isPrivate),
          repoUrl: repoRecords[0].repoUrl,
        };
      }
    }

    return NextResponse.json({
      success: true,
      isConnected,
      account: accountInfo,
      repository: repoInfo,
    });
  } catch (error: unknown) {
    console.error("GitHub Status API error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
