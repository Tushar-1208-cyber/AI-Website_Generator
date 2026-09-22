import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/config/db';
import { usersTable, projectsTable, frameTable, chatTable } from '@/config/schema';
import { eq, desc } from 'drizzle-orm';
import { ChatMessageItem } from '@/types/types';

// GET /api/project — fetch all projects for current logged-in user
export async function GET() {
  try {
    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    // Get all projects for this user, newest first
    const projects = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.createdBy, userEmail))
      .orderBy(desc(projectsTable.createdOn));

    // For each project, get first frame + first chat message (used as project title)
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const frames = await db
          .select()
          .from(frameTable)
          .where(eq(frameTable.projectID, project.projectID!))
          .limit(1);

        let title = 'Untitled Project';
        let firstFrameId: string | null = null;

        if (frames.length > 0) {
          firstFrameId = frames[0].frameID ?? null;

          const chats = await db
            .select()
            .from(chatTable)
            .where(eq(chatTable.frameID, frames[0].frameID!))
            .limit(1);

          if (chats.length > 0 && chats[0].ChatMessage) {
            const msg = chats[0].ChatMessage as ChatMessageItem | ChatMessageItem[];
            if (Array.isArray(msg) && msg.length > 0) {
              title = (msg[0]?.content as string)?.slice(0, 60) || 'Untitled Project';
            } else if (msg && 'content' in msg) {
              title = (msg.content as string)?.slice(0, 60) || 'Untitled Project';
            }
          }
        }

        return {
          projectId: project.projectID,
          title,
          firstFrameId,
          createdOn: project.createdOn,
        };
      })
    );

    return NextResponse.json({ projects: projectsWithDetails });
  } catch (error: unknown) {
    console.error('Error fetching projects:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: errMessage },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, frameId, message } = await request.json();
    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const userEmail = user.primaryEmailAddress.emailAddress;
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.username || userEmail.split('@')[0];
    const frameIdStr = String(frameId);

    // Ensure user exists in users table (create if not exists)
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, userEmail))
      .limit(1);

    if (existingUser.length === 0) {
      try {
        await db.insert(usersTable).values({
          name: userName,
          email: userEmail,
        });
      } catch (insertError: unknown) {
        const insertMsg = insertError instanceof Error ? insertError.message : '';
        if (!insertMsg.includes('duplicate') && !insertMsg.includes('unique')) {
          throw insertError;
        }
      }
    }

    const chatMessageToStore = message;

    const projectResult = await db.insert(projectsTable).values({
      projectID: projectId,
      createdBy: userEmail
    });

    const frameResult = await db.insert(frameTable).values({
      frameID: frameIdStr,
      projectID: projectId,
    });

    const chatResult = await db.insert(chatTable).values({
      ChatMessage: chatMessageToStore,
      frameID: frameIdStr,
      createdBy: userEmail
    });

    console.log('[api/project] created:', { projectResult, frameResult, chatResult });

    return NextResponse.json({
      ok: true,
      projectId,
      frameId: frameIdStr
    });
  } catch (error: unknown) {
    console.error('Error creating project:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Failed to create project', details: errMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const user = await currentUser();
    if (!user || !user.primaryEmailAddress?.emailAddress) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const userEmail = user.primaryEmailAddress.emailAddress;

    // Verify ownership
    const project = await db
      .select()
      .from(projectsTable)
      .where(eq(projectsTable.projectID, projectId))
      .limit(1);

    if (project.length === 0 || project[0].createdBy !== userEmail) {
      return NextResponse.json({ error: 'Project not found or unauthorized' }, { status: 403 });
    }

    // 1. Find all frames for this project
    const frames = await db
      .select()
      .from(frameTable)
      .where(eq(frameTable.projectID, projectId));

    // 2. Delete chats for all these frames
    for (const frame of frames) {
      if (frame.frameID) {
        await db.delete(chatTable).where(eq(chatTable.frameID, frame.frameID));
      }
    }

    // 3. Delete frames
    await db.delete(frameTable).where(eq(frameTable.projectID, projectId));

    // 4. Delete project
    await db.delete(projectsTable).where(eq(projectsTable.projectID, projectId));

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting project:', error);
    const errMessage = error instanceof Error ? error.message : 'unknown';
    return NextResponse.json(
      { error: 'Failed to delete project', details: errMessage },
      { status: 500 }
    );
  }
}
