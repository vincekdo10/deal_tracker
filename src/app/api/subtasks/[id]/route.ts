import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/services/database';
import { UpdateSubtaskRequest } from '@/types';
import { withApiSecurity } from '@/lib/secure-api';

export const PUT = withApiSecurity(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateSubtaskRequest = await request.json();
    
    const updatedSubtask = await db.updateSubtask(id, body);
    
    if (!updatedSubtask) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subtask: updatedSubtask });
  } catch (error) {
    console.error('Update subtask error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withApiSecurity(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    try {
      await db.deleteSubtask(id);
    } catch (error) {
      return NextResponse.json(
        { error: 'Subtask not found or failed to delete' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Subtask deleted successfully' });
  } catch (error) {
    console.error('Delete subtask error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
