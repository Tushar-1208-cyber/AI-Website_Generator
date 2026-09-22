import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { usersTable } from '@/config/schema';
import { eq } from 'drizzle-orm';

const PLAN_CONFIG: Record<string, { credits: number; planName: string }> = {
  free: { credits: 5, planName: 'Free' },
  pro: { credits: 50, planName: 'Pro' },
  unlimited: { credits: 999, planName: 'Unlimited' },
};

export async function POST(request: NextRequest) {
  try {
    const { plan } = await request.json();

    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    const { credits, planName } = PLAN_CONFIG[plan];

    await new Promise((resolve) => setTimeout(resolve, 1200));

    const [updated] = await db
      .update(usersTable)
      .set({ credits, plan: planName })
      .where(eq(usersTable.email, userEmail))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Mock payment successful — upgraded to ${planName}`,
      user: updated,
    });
  } catch (error: unknown) {
    console.error('Mock payment error:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Mock payment failed', details: errMessage },
      { status: 500 }
    );
  }
}
