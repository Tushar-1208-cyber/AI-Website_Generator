import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import {
  usersTable,
  projectsTable,
  frameTable,
  chatTable,
  deploymentsTable,
  projectGitHubRepositoriesTable,
  testRunsTable,
} from "@/config/schema";
import { eq, desc } from "drizzle-orm";
import { ChatMessageItem } from "@/types/types";
import { checkCanCreateProject } from "@/lib/planEntitlementEngine";
import {
  getAuthenticatedUser,
  safeErrorResponse,
  ProjectIdSchema,
  FrameIdSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const DuplicateProjectSchema = z.object({
  action: z.literal("duplicate"),
  sourceProjectId: ProjectIdSchema,
});

const CreateProjectSchema = z.object({
  action: z.undefined().optional(),
  projectId: ProjectIdSchema,
  frameId: FrameIdSchema,
  name: z.string().trim().max(100).optional().nullable(),
  message: z.any().optional(),
});

const PostProjectSchema = z.union([DuplicateProjectSchema, CreateProjectSchema]);

const PatchProjectSchema = z.object({
  projectId: ProjectIdSchema,
  name: z.string().trim().min(1, "Project name cannot be empty").max(100, "Project name cannot exceed 100 characters"),
});

// GET /api/project — fetch all projects for current logged-in user with details
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("Unauthorized. Please log in.", 401);
    }
    const { userEmail } = auth;

    // Get all projects for this user, newest first
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.createdBy, userEmail))
      .orderBy(desc(projectsTable.createdOn));

    // For each project, get first frame + title
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const frames = await db
          .select()
          .from(frameTable)
          .where(eq(frameTable.projectID, project.projectID!))
          .limit(1);

        let title = project.name || "Untitled Project";
        let firstFrameId: string | null = null;

        if (frames.length > 0) {
          firstFrameId = frames[0].frameID ?? null;

          if (!project.name) {
            const chats = await db
              .select()
              .from(chatTable)
              .where(eq(chatTable.frameID, frames[0].frameID!))
              .limit(1);

            if (chats.length > 0 && chats[0].ChatMessage) {
              const msg = chats[0].ChatMessage as ChatMessageItem | ChatMessageItem[];
              if (Array.isArray(msg) && msg.length > 0) {
                title = (msg[0]?.content as string)?.slice(0, 60) || "Untitled Project";
              } else if (msg && "content" in msg) {
                title = (msg.content as string)?.slice(0, 60) || "Untitled Project";
              }
            }
          }
        }

        return {
          projectId: project.projectID,
          title,
          name: project.name || title,
          firstFrameId,
          createdOn: project.createdOn,
        };
      })
    );

    return NextResponse.json({ projects: projectsWithDetails });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to fetch projects.", 500, error);
  }
}

// POST /api/project — create or duplicate project
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("Unauthorized. Please log in.", 401);
    }
    const { user, userEmail } = auth;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return safeErrorResponse("Invalid JSON payload.", 400);
    }

    const parseResult = PostProjectSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid project payload.";
      return safeErrorResponse(firstError, 400);
    }

    const body = parseResult.data;

    // Check project creation entitlement
    const entitlementCheck = await checkCanCreateProject(userEmail);
    if (!entitlementCheck.allowed) {
      return safeErrorResponse(entitlementCheck.reason || "Project limit reached.", 403);
    }

    // Handle project duplication
    if ("action" in body && body.action === "duplicate") {
      const sourceProjectId = body.sourceProjectId;
      const sourceProject = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.projectID, sourceProjectId))
        .limit(1);

      if (sourceProject.length === 0 || sourceProject[0].createdBy !== userEmail) {
        return safeErrorResponse("Source project not found or unauthorized.", 403);
      }

      const newProjectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newName = `${sourceProject[0].name || "Copy of Project"} (Copy)`;

      await db.insert(projectsTable).values({
        projectID: newProjectId,
        name: newName,
        createdBy: userEmail,
      });

      // Copy frames
      const sourceFrames = await db
        .select()
        .from(frameTable)
        .where(eq(frameTable.projectID, sourceProjectId));

      for (const frame of sourceFrames) {
        const newFrameId = `frame-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await db.insert(frameTable).values({
          frameID: newFrameId,
          projectID: newProjectId,
          designCode: frame.designCode,
        });
      }

      return NextResponse.json({ ok: true, projectId: newProjectId, name: newName });
    }

    // Standard Project Creation
    const { projectId, frameId, message, name } = body as z.infer<typeof CreateProjectSchema>;
    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || userEmail.split("@")[0];
    const frameIdStr = String(frameId);

    // Ensure user exists in usersTable
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    if (existingUser.length === 0) {
      try {
        await db.insert(usersTable).values({
          name: userName,
          email: userEmail,
        });
      } catch (insertError: unknown) {
        const insertMsg = insertError instanceof Error ? insertError.message : "";
        if (!insertMsg.includes("duplicate") && !insertMsg.includes("unique")) {
          throw insertError;
        }
      }
    }

    await db.insert(projectsTable).values({
      projectID: projectId,
      name: name || undefined,
      createdBy: userEmail,
    });

    await db.insert(frameTable).values({
      frameID: frameIdStr,
      projectID: projectId,
    });

    await db.insert(chatTable).values({
      ChatMessage: message,
      frameID: frameIdStr,
      createdBy: userEmail,
    });

    return NextResponse.json({
      ok: true,
      projectId,
      frameId: frameIdStr,
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to create project.", 500, error);
  }
}

// PATCH /api/project — rename project
export async function PATCH(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("Unauthorized. Please log in.", 401);
    }
    const { userEmail } = auth;

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return safeErrorResponse("Invalid JSON payload.", 400);
    }

    const parseResult = PatchProjectSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid rename payload.";
      return safeErrorResponse(firstError, 400);
    }

    const { projectId, name } = parseResult.data;

    // Verify ownership
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.projectID, projectId))
      .limit(1);

    if (project.length === 0 || project[0].createdBy !== userEmail) {
      return safeErrorResponse("Project not found or unauthorized.", 403);
    }

    await db
      .update(projectsTable)
      .set({ name })
      .where(eq(projectsTable.projectID, projectId));

    return NextResponse.json({ success: true, name });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to update project.", 500, error);
  }
}

// DELETE /api/project — delete project with ownership verification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawProjectId = searchParams.get("projectId");

    const parseResult = ProjectIdSchema.safeParse(rawProjectId);
    if (!parseResult.success) {
      return safeErrorResponse("Valid projectId is required.", 400);
    }
    const projectId = parseResult.data;

    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse("Unauthorized. Please log in.", 401);
    }
    const { userEmail } = auth;

    // Verify ownership
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.projectID, projectId))
      .limit(1);

    if (project.length === 0 || project[0].createdBy !== userEmail) {
      return safeErrorResponse("Project not found or unauthorized.", 403);
    }

    // Transactional deletion of all project child records in dependency order
    await db.transaction(async (tx) => {
      // 1. Find all frames for this project
      const frames = await tx
        .select({ frameID: frameTable.frameID })
        .from(frameTable)
        .where(eq(frameTable.projectID, projectId));

      // 2. Delete chats for all frames of this project
      for (const frame of frames) {
        if (frame.frameID) {
          await tx.delete(chatTable).where(eq(chatTable.frameID, frame.frameID));
        }
      }

      // 3. Delete frames
      await tx.delete(frameTable).where(eq(frameTable.projectID, projectId));

      // 4. Delete deployments
      await tx.delete(deploymentsTable).where(eq(deploymentsTable.projectID, projectId));

      // 5. Delete project GitHub repository link record (DB link only; remote repo preserved)
      await tx.delete(projectGitHubRepositoriesTable).where(eq(projectGitHubRepositoriesTable.projectID, projectId));

      // 6. Delete test runs history
      await tx.delete(testRunsTable).where(eq(testRunsTable.projectID, projectId));

      // 7. Delete the parent project record
      await tx.delete(projectsTable).where(eq(projectsTable.projectID, projectId));
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to delete project.", 500, error);
  }
}
