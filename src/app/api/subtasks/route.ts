import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/services/database';
import { CreateSubtaskRequest } from '@/types';
import { withApiSecurity } from '@/lib/secure-api';

export const POST = withApiSecurity(async (request: NextRequest) => {

  try {
    const userPayload = getUserFromRequest(request);
    if (!userPayload) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body: CreateSubtaskRequest = await request.json();
    
    console.log('Subtask creation request body:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.title || !body.taskId) {
      console.log('Validation failed - title:', body.title, 'taskId:', body.taskId);
      return NextResponse.json(
        { error: 'Title and taskId are required' },
        { status: 400 }
      );
    }

    const subtask = await db.createSubtask(body);
    return NextResponse.json({ subtask }, { status: 201 });
  } catch (error) {
    console.error('Create subtask error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

});
