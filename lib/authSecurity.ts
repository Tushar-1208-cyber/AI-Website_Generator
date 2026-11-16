import { currentUser, auth } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { projectsTable, frameTable } from "@/config/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Extracts and returns the authenticated Clerk user and primary email address.
 * Uses currentUser() with automatic fallback to auth() session token claims.
 * Returns null if the user is unauthenticated or has no valid email.
 */
export async function getAuthenticatedUser(): Promise<{
  user: any;
  userEmail: string;
} | null> {
  // Strategy 1: Fetch full User profile via currentUser()
  try {
    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;

    if (user && email && typeof email === "string") {
      return {
        user,
        userEmail: email,
      };
    }
  } catch (err) {
    console.warn("[AuthSecurity] currentUser() failed, falling back to auth():", err);
  }

  // Strategy 2: Fast local JWT session token verification via auth()
  try {
    const authData = await auth();
    const claims = authData?.sessionClaims as any;
    const email =
      claims?.email ||
      claims?.user_email ||
      claims?.primary_email ||
      claims?.email_address;

    if (authData?.userId && email && typeof email === "string") {
      return {
        user: { id: authData.userId },
        userEmail: email,
      };
    }
  } catch (authErr) {
    console.error("[AuthSecurity] auth() fallback failed:", authErr);
  }

  return null;
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
    const records = await db
      .select({
        frameId: frameTable.frameID,
        projectId: frameTable.projectID,
        projectOwner: projectsTable.createdBy,
      })
      .from(frameTable)
      .innerJoin(projectsTable, eq(frameTable.projectID, projectsTable.projectID))
      .where(
        and(
          eq(frameTable.frameID, frameId),
          eq(projectsTable.createdBy, userEmail)
        )
      )
      .limit(1);

    if (records.length > 0) {
      return {
        isOwner: true,
        projectId: records[0].projectId || undefined,
      };
    }

    return { isOwner: false };
  } catch (err) {
    console.error("[AuthSecurity] Error verifying frame ownership:", err);
    return { isOwner: false };
  }
}

/**
 * Standardized safe error responder to avoid credential or database leakage.
 */
export function safeErrorResponse(
  message: string,
  status: number = 500,
  err?: unknown
): NextResponse {
  if (err && process.env.NODE_ENV !== "production") {
    console.error(`[API Error ${status}]:`, err);
  }
  return NextResponse.json({ error: message }, { status });
}

export const ProjectIdSchema = z
  .string()
  .trim()
  .min(1, "Project ID is required")
  .max(120, "Project ID is too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Project ID contains invalid characters");

export const FrameIdSchema = z
  .string()
  .trim()
  .min(1, "Frame ID is required")
  .max(120, "Frame ID is too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Frame ID contains invalid characters");

export const FilesMapSchema = z
  .record(
    z.string().max(255, "File path is too long"),
    z.string().max(2 * 1024 * 1024, "Individual file content exceeds maximum 2MB size")
  )
  .refine(
    (files) => Object.keys(files).length <= 500,
    "Project exceeds maximum limit of 500 files"
  )
  .refine(
    (files) => Object.values(files).reduce((acc, str) => acc + str.length, 0) <= 10 * 1024 * 1024,
    "Total project files size exceeds 10MB limit"
  );
