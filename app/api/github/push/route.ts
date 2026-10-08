// app/api/github/push/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import {
  githubAccountsTable,
  projectGitHubRepositoriesTable,
  projectsTable,
  frameTable,
} from "@/config/schema";
import { eq, and } from "drizzle-orm";
import {
  decryptGitHubToken,
  pushFilesToGitHubRepo,
} from "@/lib/githubClient";
import { parseMultiFiles } from "@/lib/fileTree";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const body = await req.json();
    const { projectId, commitMessage, filesMap: clientFilesMap } = body;

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
        { error: "Project not found or you do not have permission to push to GitHub." },
        { status: 403 }
      );
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
      return NextResponse.json(
        { error: "No GitHub repository linked to this project. Please create or connect a repository first." },
        { status: 400 }
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
      return NextResponse.json({ error: "GitHub account not connected." }, { status: 400 });
    }

    const token = decryptGitHubToken(githubAccountRecords[0].encryptedAccessToken);
    if (!token) {
      return NextResponse.json({ error: "Invalid GitHub access token." }, { status: 400 });
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
      return NextResponse.json({ error: "No files found to push to GitHub." }, { status: 400 });
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
    console.error("GitHub Push API error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
