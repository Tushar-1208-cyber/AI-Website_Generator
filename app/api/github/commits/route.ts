// app/api/github/commits/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import {
  githubAccountsTable,
  projectGitHubRepositoriesTable,
} from "@/config/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptGitHubToken,
  getGitHubCommits,
} from "@/lib/githubClient";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
} from "@/lib/authSecurity";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("User not authenticated", 401);
    }

    const { userEmail } = auth;
    const { searchParams } = new URL(req.url);
    const rawProjectId = searchParams.get("projectId");

    const parseResult = ProjectIdSchema.safeParse(rawProjectId);
    if (!parseResult.success) {
      return safeErrorResponse("Valid 'projectId' query parameter is required", 400);
    }
    const projectId = parseResult.data;

    // Check project ownership
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return safeErrorResponse("Project not found or you do not have permission.", 403);
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
    return safeErrorResponse("Failed to fetch GitHub commits", 500, error);
  }
}
