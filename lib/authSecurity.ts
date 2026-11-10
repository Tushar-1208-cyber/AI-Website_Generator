import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { projectsTable, frameTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Extracts and returns the authenticated Clerk user and primary email address.
 * Returns null if the user is unauthenticated or has no valid email.
 */
export async function getAuthenticatedUser(): Promise<{
  user: any;
  userEmail: string;
} | null> {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return null;
    }
    return {
      user,
      userEmail: user.primaryEmailAddress.emailAddress,
    };
  } catch (err) {
    console.error("[AuthSecurity] Failed to fetch current user:", err);
    return null;
  }
}

/**
 * Verifies that a given projectID exists and is owned by the specified userEmail.
 */
export async function verifyProjectOwnership(
  projectId: string,
  userEmail: string
): Promise<boolean> {
  if (!projectId || !userEmail) return false;
  try {
    const records = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(
        and(
          eq(projectsTable.projectID, projectId),
          eq(projectsTable.createdBy, userEmail)
        )
      )
      .limit(1);

    return records.length > 0;
  } catch (err) {
    console.error("[AuthSecurity] Error verifying project ownership:", err);
    return false;
  }
}

/**
 * Verifies that a given frameID exists and belongs to a project owned by userEmail.
 */
export async function verifyFrameOwnership(
  frameId: string,
  userEmail: string
): Promise<{ isOwner: boolean; projectId?: string }> {
  if (!frameId || !userEmail) return { isOwner: false };
  try {
    const frames = await db
      .select({ projectID: frameTable.projectID })
      .from(frameTable)
      .where(eq(frameTable.frameID, frameId))
      .limit(1);

    if (frames.length === 0 || !frames[0].projectID) {
      return { isOwner: false };
    }

    const projectId = frames[0].projectID;
    const isOwner = await verifyProjectOwnership(projectId, userEmail);
    return { isOwner, projectId };
  } catch (err) {
    console.error("[AuthSecurity] Error verifying frame ownership:", err);
    return { isOwner: false };
  }
}

/**
 * Returns a standardized error response without leaking sensitive database or stack details.
 */
export function safeErrorResponse(
  clientMessage: string,
  status: number = 500,
  internalError?: unknown
) {
  if (internalError) {
    console.error(`[API Error ${status}]:`, internalError);
  }
  return NextResponse.json({ error: clientMessage }, { status });
}

// -------------------------------------------------------------
// Common Input Validation Schemas (Zod)
// -------------------------------------------------------------

export const ProjectIdSchema = z
  .string()
  .trim()
  .min(1, "Project ID cannot be empty")
  .max(120, "Project ID exceeds maximum length of 120 characters");

export const FrameIdSchema = z
  .string()
  .trim()
  .min(1, "Frame ID cannot be empty")
  .max(120, "Frame ID exceeds maximum length of 120 characters");

export const FilesMapSchema = z
  .record(z.string().max(256), z.string())
  .refine((files) => Object.keys(files).length <= 500, {
    message: "Files payload exceeds maximum limit of 500 files",
  })
  .refine(
    (files) => {
      let totalBytes = 0;
      for (const [key, val] of Object.entries(files)) {
        totalBytes += key.length + (typeof val === "string" ? val.length : 0);
        if (totalBytes > 10 * 1024 * 1024) return false; // 10MB limit
      }
      return true;
    },
    { message: "Total files payload size exceeds 10MB limit" }
  );
