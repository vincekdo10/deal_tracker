import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canAccessDeal } from '@/lib/auth';
import { db } from '@/services/database';
import { UpdateDealRequest } from '@/types';
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

    // Get related data to match DealWithRelations interface
    const [creator, assignedTo, team, tasks] = await Promise.all([
      db.getUserById(deal.createdBy),
      deal.assignedTo ? db.getUserById(deal.assignedTo) : null,
      deal.teamId ? db.getTeamById(deal.teamId) : null,
      db.getTasksForDeal(deal.id)
    ]);

    // Convert to DealWithRelations format
    const dealWithRelations = {
      ...deal,
      // Convert comma-separated strings back to arrays, handle null/undefined values
          stakeholders: typeof deal.stakeholders === 'string' 
            ? (deal.stakeholders as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : (Array.isArray(deal.stakeholders) ? deal.stakeholders : []),
          productsInUse: typeof deal.productsInUse === 'string'
            ? (deal.productsInUse as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : (Array.isArray(deal.productsInUse) ? deal.productsInUse : []),
          growthOpportunities: typeof deal.growthOpportunities === 'string'
            ? (deal.growthOpportunities as string).split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0)
            : (Array.isArray(deal.growthOpportunities) ? deal.growthOpportunities : []),
      creator: creator || { id: deal.createdBy, firstName: 'Unknown', lastName: 'User', email: 'unknown@example.com' },
      assignedTo: assignedTo || null,
      team: team || { id: 'no-team', name: 'No Team', description: 'No team assigned' },
      tasks: tasks || []
    };

    return NextResponse.json({ deal: dealWithRelations });
  } catch (error) {
    console.error('Get deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withApiSecurity(async (
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

    const body: UpdateDealRequest = await request.json();
    const updatedDeal = await db.updateDeal(id, body);
    
    return NextResponse.json({ deal: updatedDeal });
  } catch (error) {
    console.error('Update deal error:', error);
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

    const success = await db.deleteDeal(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete deal' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Delete deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
