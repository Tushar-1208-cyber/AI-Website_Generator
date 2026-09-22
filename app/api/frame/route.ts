import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { frameTable, chatTable } from '@/config/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/frame — create a new version/frame inside an existing project.
export async function POST(request: NextRequest) {
  try {
    const { projectId, startingCode } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const newFrameId = String(Math.floor(Math.random() * 1000000));

    await db.insert(frameTable).values({
      frameID: newFrameId,
      projectID: projectId,
      designCode: startingCode ?? '',
    });

    return NextResponse.json({ frameId: newFrameId });
  } catch (error: unknown) {
    console.error('Error creating new version:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Failed to create new version', details: errMessage },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const frameId = searchParams.get('frameId');
    const projectId = searchParams.get('projectId');

    if (!frameId || !projectId) {
      return NextResponse.json(
        { error: 'frameId and projectId are required' },
        { status: 400 }
      );
    }

    const frame = await db
      .select()
      .from(frameTable)
      .where(
        and(
          eq(frameTable.frameID, frameId),
          eq(frameTable.projectID, projectId)
        )
      )
      .limit(1);

    if (frame.length === 0) {
      return NextResponse.json(
        { error: 'Frame not found' },
        { status: 404 }
      );
    }

    const chats = await db
      .select()
      .from(chatTable)
      .where(eq(chatTable.frameID, frameId));

    let chatMessages = [];
    if (chats.length > 0) {
      const firstChat = chats[0].ChatMessage;
      if (Array.isArray(firstChat)) {
        chatMessages = firstChat;
      } else {
        chatMessages = chats.map(chat => chat.ChatMessage).filter(Boolean);
      }
    }

    return NextResponse.json({
      ...frame[0],
      chatMessages
    });
  } catch (error: unknown) {
    console.error('Error fetching frame:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Failed to fetch frame', details: errMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { frameId, projectId, designCode } = await request.json();

    if (!frameId || !projectId) {
      return NextResponse.json(
        { error: 'frameId and projectId are required' },
        { status: 400 }
      );
    }

    await db
      .update(frameTable)
      .set({ designCode })
      .where(
        and(
          eq(frameTable.frameID, frameId),
          eq(frameTable.projectID, projectId)
        )
      );

    return NextResponse.json({ result: 'updated' });
  } catch (error: unknown) {
    console.error('Error updating frame:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Failed to update frame', details: errMessage },
      { status: 500 }
    );
  }
}
