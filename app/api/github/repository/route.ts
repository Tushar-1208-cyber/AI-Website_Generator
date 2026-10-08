// app/api/github/repository/route.ts
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
  createGitHubRepository,
  sanitizeGitHubRepoName,
} from "@/lib/githubClient";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const body = await req.json();
    const { projectId, repoName, isPrivate = true, description } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Missing required 'projectId' in body" }, { status: 400 });
    }

    // 1. Verify project ownership
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

    // 2. Retrieve user's encrypted GitHub token
    const githubAccountRecords = await db
      .select()
      .from(githubAccountsTable)
      .where(eq(githubAccountsTable.userEmail, userEmail))
      .limit(1);

    if (githubAccountRecords.length === 0) {
      return NextResponse.json(
        { error: "GitHub account not connected. Please connect GitHub first." },
        { status: 400 }
      );
    }

    const token = decryptGitHubToken(githubAccountRecords[0].encryptedAccessToken);
    if (!token) {
      return NextResponse.json(
        { error: "Invalid or corrupted GitHub access token. Please reconnect GitHub." },
        { status: 400 }
      );
    }

    // 3. Create real GitHub repository via GitHub REST API
    const targetRepoName = sanitizeGitHubRepoName(repoName || existingProjects[0].name || projectId);
    const repoResult = await createGitHubRepository(token, {
      repoName: targetRepoName,
      description: description || `Repository for ${existingProjects[0].name || projectId}`,
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
    console.error("GitHub Create Repo API error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
