// app/api/github/commits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import {
  githubAccountsTable,
  projectGitHubRepositoriesTable,
  projectsTable,
} from "@/config/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptGitHubToken,
  getGitHubCommits,
} from "@/lib/githubClient";

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing 'projectId' query parameter" }, { status: 400 });
    }

    // Check project ownership
    const existingProjects = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.projectID, projectId), eq(projectsTable.createdBy, userEmail)))
      .limit(1);

    if (existingProjects.length === 0) {
      return NextResponse.json(
        { error: "Project not found or you do not have permission." },
        { status: 403 }
      );
    }

    // Check repository link
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

    if (repoRecords.length === 0) {
      return NextResponse.json({ success: true, commits: [] });
    }

    const repo = repoRecords[0];

    // Check GitHub token
    const githubAccountRecords = await db
      .select()
      .from(githubAccountsTable)
      .where(eq(githubAccountsTable.userEmail, userEmail))
      .limit(1);

    if (githubAccountRecords.length === 0) {
      return NextResponse.json({ success: true, commits: [] });
    }

    const token = decryptGitHubToken(githubAccountRecords[0].encryptedAccessToken);
    if (!token) {
      return NextResponse.json({ success: true, commits: [] });
    }

    // Fetch real commits from GitHub API
    const commits = await getGitHubCommits(token, repo.owner, repo.repoName, repo.branch || "main");

    return NextResponse.json({
      success: true,
      commits,
    });
  } catch (error: unknown) {
    console.error("GitHub Commits API error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
