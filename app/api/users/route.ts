import { NextResponse } from 'next/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq, sql, and, gte } from 'drizzle-orm';
import { getAuthenticatedUser, safeErrorResponse } from '@/lib/authSecurity';

// POST /api/users — create user if not exists, return user details
export async function POST() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse('User not authenticated.', 401);
    }

    const { user, userEmail } = auth;
    const userName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.username || userEmail.split('@')[0];

    // Check if user exists
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    if (existingUser.length > 0) {
      // User already exists — return their details
      return NextResponse.json({ user: existingUser[0] });
    }

    // Create new user with default 15 credits (Free plan entitlement)
    const [newUser] = await db
      .insert(usersTable)
      .values({
        name: userName,
        email: userEmail,
        credits: 15,
      })
      .returning();

    return NextResponse.json({ user: newUser });
  } catch (error: unknown) {
    return safeErrorResponse('Failed to process user record.', 500, error);
  }
}

// GET /api/users — get current user details
export async function GET() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse('User not authenticated.', 401);
    }

    const { userEmail } = auth;

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    if (existingUser.length === 0) {
      return safeErrorResponse('User not found.', 404);
    }

    return NextResponse.json({ user: existingUser[0] });
  } catch (error: unknown) {
    return safeErrorResponse('Failed to fetch user record.', 500, error);
  }
}

// PATCH /api/users — deduct 1 credit atomically after AI generation
export async function PATCH() {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth) {
      return safeErrorResponse('User not authenticated.', 401);
    }

    const { userEmail } = auth;

    // Atomic update to avoid race conditions
    const updated = await db
      .update(usersTable)
      .set({ credits: sql`${usersTable.credits} - 1` })
      .where(and(eq(usersTable.email, userEmail), gte(usersTable.credits, 1)))
      .returning();

    if (updated.length === 0) {
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, userEmail))
        .limit(1);

      if (existingUser.length === 0) {
        return safeErrorResponse('User not found.', 404);
      }

      return NextResponse.json(
        { error: 'No credits remaining', credits: 0 },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: updated[0] });
  } catch (error: unknown) {
    return safeErrorResponse('Failed to deduct credit.', 500, error);
  }
}
