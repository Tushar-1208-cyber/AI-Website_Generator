import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { usersTable, projectsTable, frameTable, chatTable } from "@/config/schema";
import { eq, desc } from "drizzle-orm";
import { ChatMessageItem } from "@/types/types";
import { checkCanCreateProject } from "@/lib/planEntitlementEngine";

// GET /api/project — fetch all projects for current logged-in user with details
export async function GET() {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

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
    console.error("Error fetching projects:", error);
    const errMessage = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: "Failed to fetch projects", details: errMessage },
      { status: 500 }
    );
  }
}

// POST /api/project — create or duplicate project
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const body = await request.json();

    // Check project creation entitlement
    const entitlementCheck = await checkCanCreateProject(userEmail);
    if (!entitlementCheck.allowed) {
      return NextResponse.json({ error: entitlementCheck.reason }, { status: 403 });
    }

    // Handle project duplication
    if (body.action === "duplicate" && body.sourceProjectId) {
      const sourceProjectId = body.sourceProjectId;
      const sourceProject = await db
        .select()
        .from(projectsTable)
        .where(eq(projectsTable.projectID, sourceProjectId))
        .limit(1);

      if (sourceProject.length === 0 || sourceProject[0].createdBy !== userEmail) {
        return NextResponse.json({ error: "Source project not found or unauthorized" }, { status: 403 });
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
    const { projectId, frameId, message, name } = body;
    const userName = user.firstName && user.lastName 
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
    console.error("Error creating project:", error);
    const errMessage = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: "Failed to create project", details: errMessage },
      { status: 500 }
    );
  }
}

// PATCH /api/project — rename project
export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    const { projectId, name } = await request.json();
    if (!projectId || !name) {
      return NextResponse.json({ error: "projectId and name parameters are required" }, { status: 400 });
    }

    // Verify ownership
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.projectID, projectId))
      .limit(1);

    if (project.length === 0 || project[0].createdBy !== userEmail) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 403 });
    }

    await db
      .update(projectsTable)
      .set({ name })
      .where(eq(projectsTable.projectID, projectId));

    return NextResponse.json({ success: true, name });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "unknown";
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

// DELETE /api/project — delete project with ownership verification
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    // Verify ownership
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.projectID, projectId))
      .limit(1);

    if (project.length === 0 || project[0].createdBy !== userEmail) {
      return NextResponse.json({ error: "Project not found or unauthorized" }, { status: 403 });
    }

    const frames = await db
      .select()
      .from(frameTable)
      .where(eq(frameTable.projectID, projectId));

    for (const frame of frames) {
      if (frame.frameID) {
        await db.delete(chatTable).where(eq(chatTable.frameID, frame.frameID));
      }
    }

    await db.delete(frameTable).where(eq(frameTable.projectID, projectId));
    await db.delete(projectsTable).where(eq(projectsTable.projectID, projectId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting project:", error);
    const errMessage = error instanceof Error ? error.message : "unknown";
    return NextResponse.json(
      { error: "Failed to delete project", details: errMessage },
      { status: 500 }
    );
  }
}
