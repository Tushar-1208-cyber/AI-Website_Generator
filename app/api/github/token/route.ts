// app/api/github/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/config/db";
import { githubAccountsTable } from "@/config/schema";
import { eq } from "drizzle-orm";
import {
  getGitHubUserProfile,
  encryptGitHubToken,
} from "@/lib/githubClient";

export async function POST(req: NextRequest) {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string" || !token.trim()) {
      return NextResponse.json({ error: "Missing GitHub Personal Access Token or OAuth Token" }, { status: 400 });
    }

    const cleanToken = token.trim();

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
    console.error("GitHub Token API error:", error);
    const errMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMessage }, { status: 500 });
  }
}
