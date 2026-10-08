// app/api/deploy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { projectsTable, frameTable, deploymentsTable } from "@/config/schema";
import { eq, and, desc } from "drizzle-orm";
import { parseMultiFiles } from "@/lib/fileTree";
import {
  createVercelDeployment,
  pollVercelDeploymentStatus,
  sanitizeVercelPath,
} from "@/lib/vercelClient";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const body = await req.json();
    const { projectId, filesMap: clientFilesMap } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json({ error: "Missing required 'projectId' in request body" }, { status: 400 });
    }

    // 1. Verify project existence and user ownership
    const existingProjects = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.projectID, projectId), eq(projectsTable.createdBy, userEmail)))
      .limit(1);

    if (existingProjects.length === 0) {
      return NextResponse.json(
        { error: "Project not found or you do not have permission to deploy it." },
        { status: 403 }
      );
    }

    const project = existingProjects[0];

    // 2. Resolve project files map
    let targetFilesMap: Record<string, string> = {};

    if (clientFilesMap && typeof clientFilesMap === "object" && Object.keys(clientFilesMap).length > 0) {
      targetFilesMap = clientFilesMap;
    } else {
      // Load from database frame
      const frameRecords = await db
        .select()
        .from(frameTable)
        .where(eq(frameTable.projectID, projectId))
        .limit(1);

      if (frameRecords.length > 0 && frameRecords[0].designCode) {
        targetFilesMap = parseMultiFiles(frameRecords[0].designCode);
      }
    }

    // 3. Validate files map
    const cleanFilesMap: Record<string, string> = {};
    for (const [path, content] of Object.entries(targetFilesMap)) {
      const cleanPath = sanitizeVercelPath(path);
      if (cleanPath && typeof content === "string") {
        cleanFilesMap[cleanPath] = content;
      }
    }

    if (Object.keys(cleanFilesMap).length === 0) {
      return NextResponse.json(
        { error: "Deployment failed: Project contains no deployable code files." },
        { status: 400 }
      );
    }

    if (!cleanFilesMap["index.html"] && !cleanFilesMap["index.htm"]) {
      return NextResponse.json(
        { error: "Deployment failed: Project must contain a primary 'index.html' entry file." },
        { status: 400 }
      );
    }

    // 4. Create Vercel Deployment via Vercel REST API
    const projectName = project.name || `site-${projectId.slice(0, 8)}`;
    const deployInit = await createVercelDeployment({
      projectName,
      filesMap: cleanFilesMap,
      target: "production",
    });

    // 5. Poll Vercel deployment status
    const finalStatus = await pollVercelDeploymentStatus(deployInit.deploymentId, 30000);

    // 6. Save deployment record in database
    const [insertedRecord] = await db
      .insert(deploymentsTable)
      .values({
        deploymentID: finalStatus.deploymentId,
        projectID: projectId,
        userEmail: userEmail,
        url: finalStatus.url,
        status: finalStatus.readyState,
        error: finalStatus.error || null,
        readyOn: finalStatus.readyState === "READY" ? new Date() : null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      deployment: {
        id: insertedRecord.id,
        deploymentID: insertedRecord.deploymentID,
        projectID: insertedRecord.projectID,
        url: insertedRecord.url,
        status: insertedRecord.status,
        error: insertedRecord.error,
        createdOn: insertedRecord.createdOn,
        readyOn: insertedRecord.readyOn,
      },
    });
  } catch (error: unknown) {
    console.error("Vercel Deploy API Error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}

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
        { error: "Project not found or you do not have permission to view deployments." },
        { status: 403 }
      );
    }

    // Fetch deployment history
    const deployments = await db
      .select()
      .from(deploymentsTable)
      .where(and(eq(deploymentsTable.projectID, projectId), eq(deploymentsTable.userEmail, userEmail)))
      .orderBy(desc(deploymentsTable.createdOn));

    return NextResponse.json({
      success: true,
      deployments,
    });
  } catch (error: unknown) {
    console.error("Vercel Deploy GET History Error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
