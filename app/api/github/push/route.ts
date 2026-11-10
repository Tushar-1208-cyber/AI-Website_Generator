// app/api/github/push/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import {
  githubAccountsTable,
  projectGitHubRepositoriesTable,
  frameTable,
} from "@/config/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptGitHubToken,
  pushFilesToGitHubRepo,
} from "@/lib/githubClient";
import { parseMultiFiles } from "@/lib/fileTree";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
  FilesMapSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const PushSchema = z.object({
  projectId: ProjectIdSchema,
  commitMessage: z.string().trim().max(500).optional(),
  filesMap: FilesMapSchema.optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("User not authenticated", 401);
    }

    const { userEmail } = auth;

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return safeErrorResponse("Invalid JSON payload", 400);
    }

    const parseResult = PushSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid push payload";
      return safeErrorResponse(firstError, 400);
    }

    const { projectId, commitMessage, filesMap: clientFilesMap } = parseResult.data;

    // 1. Verify project ownership
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return safeErrorResponse("Project not found or you do not have permission to push to GitHub.", 403);
    }

    // 2. Fetch linked GitHub repository
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
      return safeErrorResponse(
        "No GitHub repository linked to this project. Please create or connect a repository first.",
        400
      );
    }

    const repo = repoRecords[0];

    // 3. Fetch user's encrypted GitHub token
    const githubAccountRecords = await db
      .select()
      .from(githubAccountsTable)
      .where(eq(githubAccountsTable.userEmail, userEmail))
      .limit(1);

    if (githubAccountRecords.length === 0) {
      return safeErrorResponse("GitHub account not connected.", 400);
    }

    const token = decryptGitHubToken(githubAccountRecords[0].encryptedAccessToken);
    if (!token) {
      return safeErrorResponse("Invalid GitHub access token.", 400);
    }

    // 4. Resolve files map to push
    let targetFilesMap: Record<string, string> = {};
    if (clientFilesMap && typeof clientFilesMap === "object" && Object.keys(clientFilesMap).length > 0) {
      targetFilesMap = clientFilesMap;
    } else {
      const frameRecords = await db
        .select()
        .from(frameTable)
        .where(eq(frameTable.projectID, projectId))
        .limit(1);

      if (frameRecords.length > 0 && frameRecords[0].designCode) {
        targetFilesMap = parseMultiFiles(frameRecords[0].designCode);
      }
    }

    if (Object.keys(targetFilesMap).length === 0) {
      return safeErrorResponse("No files found to push to GitHub.", 400);
    }

    // 5. Execute real multi-file push to GitHub
    const pushResult = await pushFilesToGitHubRepo(
      token,
      repo.owner,
      repo.repoName,
      repo.branch || "main",
      targetFilesMap,
      commitMessage || "feat: update project files via AI Builder"
    );

    return NextResponse.json({
      success: true,
      commit: {
        sha: pushResult.commitSha,
        shortSha: pushResult.commitSha.slice(0, 7),
        commitUrl: pushResult.commitUrl,
        repoUrl: repo.repoUrl,
        message: commitMessage || "feat: update project files via AI Builder",
        pushedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to push files to GitHub repository", 500, error);
  }
}
