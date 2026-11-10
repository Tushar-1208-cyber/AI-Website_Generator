// app/api/github/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { githubAccountsTable, projectGitHubRepositoriesTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";
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

    let projectId: string | null = null;
    if (rawProjectId) {
      const parsed = ProjectIdSchema.safeParse(rawProjectId);
      if (!parsed.success) {
        return safeErrorResponse("Invalid projectId parameter", 400);
      }
      projectId = parsed.data;

      const isOwner = await verifyProjectOwnership(projectId, userEmail);
      if (!isOwner) {
        return safeErrorResponse("Forbidden: You do not own this project", 403);
      }
    }

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
    return safeErrorResponse("Failed to fetch GitHub status", 500, error);
  }
}
