import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

// POST /api/users — create user if not exists, return user details
export async function POST() {
  try {
    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
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

    // Create new user with default 5 credits
    const [newUser] = await db
      .insert(usersTable)
      .values({
        name: userName,
        email: userEmail,
        credits: 5,
      })
      .returning();

    return NextResponse.json({ user: newUser });
  } catch (error: unknown) {
    console.error('Error creating/fetching user:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to process user', details: err?.message ?? 'unknown' },
      { status: 500 }
    );
  }
}

// GET /api/users — get current user details
export async function GET() {
  try {
    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: existingUser[0] });
  } catch (error: unknown) {
    console.error('Error fetching user:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to fetch user', details: err?.message ?? 'unknown' },
      { status: 500 }
    );
  }
}

// PATCH /api/users — deduct 1 credit after AI generation
export async function PATCH() {
  try {
    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;

    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentCredits = existingUser[0].credits ?? 0;

    if (currentCredits <= 0) {
      return NextResponse.json(
        { error: 'No credits remaining', credits: 0 },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(usersTable)
      .set({ credits: currentCredits - 1 })
      .where(eq(usersTable.email, userEmail))
      .returning();

    return NextResponse.json({ user: updated });
  } catch (error: unknown) {
    console.error('Error deducting credit:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: 'Failed to deduct credit', details: err?.message ?? 'unknown' },
      { status: 500 }
    );
  }
}
