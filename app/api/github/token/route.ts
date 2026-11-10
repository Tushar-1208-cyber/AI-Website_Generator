// app/api/github/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/config/db";
import { githubAccountsTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import {
  getGitHubUserProfile,
  encryptGitHubToken,
} from "@/lib/githubClient";
import { getAuthenticatedUser, safeErrorResponse } from "@/lib/authSecurity";
import { z } from "zod";

const GitHubTokenSchema = z.object({
  token: z
    .string()
    .trim()
    .min(10, "GitHub Personal Access Token or OAuth Token is too short")
    .max(512, "GitHub token exceeds maximum allowed length"),
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

    const parseResult = GitHubTokenSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid token payload";
      return safeErrorResponse(firstError, 400);
    }

    const cleanToken = parseResult.data.token;

    // 1. Verify token with GitHub API /user
    const profile = await getGitHubUserProfile(cleanToken);

    // 2. Encrypt token server-side
    const encryptedToken = encryptGitHubToken(cleanToken);

    // 3. Upsert into database
    const existing = await db
      .select()
      .from(githubAccountsTable)
      .where(eq(githubAccountsTable.userEmail, userEmail))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(githubAccountsTable)
        .set({
          githubUserId: profile.githubUserId,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          encryptedAccessToken: encryptedToken,
          updatedOn: new Date(),
        })
        .where(eq(githubAccountsTable.userEmail, userEmail));
    } else {
      await db.insert(githubAccountsTable).values({
        userEmail,
        githubUserId: profile.githubUserId,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        encryptedAccessToken: encryptedToken,
      });
    }

    return NextResponse.json({
      success: true,
      account: {
        username: profile.username,
        avatarUrl: profile.avatarUrl,
      },
    });
  } catch (error: unknown) {
    return safeErrorResponse("Failed to save and verify GitHub token", 500, error);
  }
}
