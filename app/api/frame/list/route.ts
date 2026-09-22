import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/config/db';
import { frameTable } from '@/config/schema';
import { eq, asc } from 'drizzle-orm';

// GET /api/frame/list?projectId=... — list all versions/frames for a project
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const frames = await db
      .select({
        frameID: frameTable.frameID,
        createdOn: frameTable.createdOn,
      })
      .from(frameTable)
      .where(eq(frameTable.projectID, projectId))
      .orderBy(asc(frameTable.createdOn));

    return NextResponse.json({ frames });
  } catch (error: unknown) {
    console.error('Error listing versions:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Failed to list versions', details: errMessage },
      { status: 500 }
    );
  }
}
