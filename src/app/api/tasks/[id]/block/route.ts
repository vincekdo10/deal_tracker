import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/services/database';
import { BlockTaskRequest } from '@/types';
import { withApiSecurity } from '@/lib/secure-api';

export const POST = withApiSecurity(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body: BlockTaskRequest = await request.json();
    
    if (!body.reason) {
      return NextResponse.json(
        { error: 'Blocking reason is required' },
        { status: 400 }
      );
    }

    const expectedUnblockDate = body.expectedUnblockDate ? new Date(body.expectedUnblockDate) : undefined;
    const task = await db.blockTask(id, body.reason, expectedUnblockDate);
    
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Block task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
