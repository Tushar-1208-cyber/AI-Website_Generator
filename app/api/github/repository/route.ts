// app/api/github/repository/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import {
  githubAccountsTable,
  projectGitHubRepositoriesTable,
  projectsTable,
} from "@/config/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptGitHubToken,
  createGitHubRepository,
  sanitizeGitHubRepoName,
} from "@/lib/githubClient";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const CreateRepoSchema = z.object({
  projectId: ProjectIdSchema,
  repoName: z.string().trim().max(100).optional(),
  isPrivate: z.boolean().optional(),
  description: z.string().trim().max(500).optional(),
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

    const parseResult = CreateRepoSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid repository payload";
      return safeErrorResponse(firstError, 400);
    }

    const { projectId, repoName, isPrivate = true, description } = parseResult.data;

    // 1. Verify project ownership
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return safeErrorResponse("Project not found or you do not have permission.", 403);
    }

    const existingProjects = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.projectID, projectId), eq(projectsTable.createdBy, userEmail)))
      .limit(1);

    // 2. Retrieve user's encrypted GitHub token
    const githubAccountRecords = await db
      .select()
      .from(githubAccountsTable)
      .where(eq(githubAccountsTable.userEmail, userEmail))
      .limit(1);

    if (githubAccountRecords.length === 0) {
      return safeErrorResponse("GitHub account not connected. Please connect GitHub first.", 400);
    }

    const token = decryptGitHubToken(githubAccountRecords[0].encryptedAccessToken);
    if (!token) {
      return safeErrorResponse("Invalid or corrupted GitHub access token. Please reconnect GitHub.", 400);
    }

    // 3. Create real GitHub repository via GitHub REST API
    const targetRepoName = sanitizeGitHubRepoName(repoName || existingProjects[0]?.name || projectId);
    const repoResult = await createGitHubRepository(token, {
      repoName: targetRepoName,
      description: description || `Repository for ${existingProjects[0]?.name || projectId}`,
      isPrivate: Boolean(isPrivate),
    });

    // 4. Link repository to project in database
    const existingLinks = await db
      .select()
      .from(projectGitHubRepositoriesTable)
      .where(
        and(
          eq(projectGitHubRepositoriesTable.projectID, projectId),
          eq(projectGitHubRepositoriesTable.userEmail, userEmail)
        )
      )
      .limit(1);

    if (existingLinks.length > 0) {
      await db
        .update(projectGitHubRepositoriesTable)
        .set({
          repositoryId: repoResult.repositoryId,
          owner: repoResult.owner,
          repoName: repoResult.repoName,
          branch: repoResult.defaultBranch,
          isPrivate: isPrivate ? 1 : 0,
          repoUrl: repoResult.repoUrl,
          updatedOn: new Date(),
        })
        .where(eq(projectGitHubRepositoriesTable.id, existingLinks[0].id));
    } else {
      await db.insert(projectGitHubRepositoriesTable).values({
        projectID: projectId,
        userEmail,
        repositoryId: repoResult.repositoryId,
        owner: repoResult.owner,
        repoName: repoResult.repoName,
        branch: repoResult.defaultBranch,
        isPrivate: isPrivate ? 1 : 0,
        repoUrl: repoResult.repoUrl,
      });
    }

    return NextResponse.json({
      success: true,
      repository: {
        owner: repoResult.owner,
        repoName: repoResult.repoName,
        branch: repoResult.defaultBranch,
        isPrivate: Boolean(isPrivate),
        repoUrl: repoResult.repoUrl,
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to create GitHub repository", 500, error);
  }
}
