// app/api/github/disconnect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import {
  githubAccountsTable,
  projectGitHubRepositoriesTable,
} from "@/config/schema";
import { eq, and } from "drizzle-orm";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const DisconnectSchema = z.object({
  action: z.enum(["disconnect_account", "unlink_project"]).default("unlink_project"),
  projectId: ProjectIdSchema.optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("User not authenticated", 401);
    }

    const { userEmail } = auth;

    let rawBody: unknown = {};
    try {
      rawBody = await req.json();
    } catch {
      rawBody = {};
    }

    const parseResult = DisconnectSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid disconnect payload";
      return safeErrorResponse(firstError, 400);
    }

    const { projectId, action } = parseResult.data;

    if (action === "disconnect_account") {
      await db
        .delete(githubAccountsTable)
        .where(eq(githubAccountsTable.userEmail, userEmail));

      if (projectId) {
        const isOwner = await verifyProjectOwnership(projectId, userEmail);
        if (isOwner) {
          await db
            .delete(projectGitHubRepositoriesTable)
            .where(
              and(
                eq(projectGitHubRepositoriesTable.projectID, projectId),
                eq(projectGitHubRepositoriesTable.userEmail, userEmail)
              )
            );
        }
      }

      return NextResponse.json({
        success: true,
        message: "Disconnected GitHub account. Your GitHub repositories remain intact on GitHub.",
      });
    }

    if (projectId) {
      const isOwner = await verifyProjectOwnership(projectId, userEmail);
      if (!isOwner) {
        return safeErrorResponse("Project not found or you do not have permission.", 403);
      }

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

    return safeErrorResponse("Missing projectId parameter for unlinking repository", 400);
  } catch (error: unknown) {
    return safeErrorResponse("Failed to disconnect GitHub resource", 500, error);
  }
}
