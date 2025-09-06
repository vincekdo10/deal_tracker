import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canAccessDeal } from '@/lib/auth';
import { db } from '@/services/database';
import { CreateTaskRequest } from '@/types';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (
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
    const deal = await db.getDealById(id);
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Check if user can access this deal
    if (!canAccessDeal(userPayload as any, { 
      createdBy: deal.createdBy, 
      assignedTo: deal.assignedTo, 
      teamId: deal.teamId 
    })) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const tasks = await db.getTasksForDealWithSubtasks(id);
    
    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

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
    const deal = await db.getDealById(id);
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Check if user can access this deal
    if (!canAccessDeal(userPayload as any, { 
      createdBy: deal.createdBy, 
      assignedTo: deal.assignedTo, 
      teamId: deal.teamId 
    })) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body: CreateTaskRequest = await request.json();
    
    // Validate required fields
    if (!body.title || !body.dealId) {
      return NextResponse.json(
        { error: 'Title and deal ID are required' },
        { status: 400 }
      );
    }

    // Ensure the task is for the correct deal
    if (body.dealId !== id) {
      return NextResponse.json(
        { error: 'Deal ID mismatch' },
        { status: 400 }
      );
    }

    const task = await db.createTask(body);
    
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
