import { db } from '@/config/db';
import { chatTable } from '@/config/schema';
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
    try {
        const { messages, frameId } = await req.json();
        const user = await currentUser();
        
        if (!user || !user.primaryEmailAddress?.emailAddress) {
            return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
        }

        const userEmail = user.primaryEmailAddress.emailAddress;

        // Delete existing chat messages for this frame
        await db.delete(chatTable).where(eq(chatTable.frameID, frameId));

        // Insert all messages as array into single row
        await db.insert(chatTable).values({
            ChatMessage: messages,
            frameID: frameId,
            createdBy: userEmail
        });

        return NextResponse.json({
            result: 'updated'
        });
    } catch (error: unknown) {
        console.error('Error updating chats:', error);
        const errMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json(
            { error: 'Failed to update chats', details: errMessage },
            { status: 500 }
        );
    }
}