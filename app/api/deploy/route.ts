// app/api/deploy/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { projectsTable, frameTable, deploymentsTable } from "@/config/schema";
import { eq, and, desc } from "drizzle-orm";
import { parseMultiFiles } from "@/lib/fileTree";
import {
  createVercelDeployment,
  pollVercelDeploymentStatus,
  sanitizeVercelPath,
} from "@/lib/vercelClient";
import {
  getAuthenticatedUser,
  verifyProjectOwnership,
  safeErrorResponse,
  ProjectIdSchema,
  FilesMapSchema,
} from "@/lib/authSecurity";
import { z } from "zod";

const DeployRequestSchema = z.object({
  projectId: ProjectIdSchema,
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

    const parseResult = DeployRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid deployment request payload";
      return safeErrorResponse(firstError, 400);
    }

    const { projectId, filesMap: clientFilesMap } = parseResult.data;

    // 1. Verify project existence and user ownership
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    if (!isOwner) {
      return safeErrorResponse("Project not found or you do not have permission to deploy it.", 403);
    }

    const existingProjects = await db
      .select()
      .from(projectsTable)
      .where(and(eq(projectsTable.projectID, projectId), eq(projectsTable.createdBy, userEmail)))
      .limit(1);

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
      return safeErrorResponse("Deployment failed: Project contains no deployable code files.", 400);
    }

    if (!cleanFilesMap["index.html"] && !cleanFilesMap["index.htm"]) {
      return safeErrorResponse("Deployment failed: Project must contain a primary 'index.html' entry file.", 400);
    }

    // 4. Create Vercel Deployment via Vercel REST API
    const projectName = project?.name || `site-${projectId.slice(0, 8)}`;
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
    return safeErrorResponse("Failed to deploy project to Vercel.", 500, error);
  }
}

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
      return safeErrorResponse("Project not found or you do not have permission to view deployments.", 403);
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
    return safeErrorResponse("Failed to fetch deployment history.", 500, error);
  }
}
