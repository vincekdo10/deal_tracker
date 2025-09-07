import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/services/database';
import { CreateDealRequest } from '@/types';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (request: NextRequest) => {
  try {
    // Initialize database if not already done
    await db.initialize();
    
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get user details to determine role
    const user = await db.getUserById(userPayload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const deals = await db.getDealsForUser(userPayload.userId, user.role);
    
    // Convert to DealWithRelations by fetching additional data
    const dealsWithRelations = await Promise.all(
      deals.map(async (deal) => {
        // Get creator user
        const creator = await db.getUserById(deal.createdBy);
        
        // Get assigned user if exists
        let assignedTo = null;
        if (deal.assignedTo) {
          assignedTo = await db.getUserById(deal.assignedTo);
        }
        
        // Get team if exists
        let team = null;
        if (deal.teamId) {
          team = await db.getTeamById(deal.teamId);
        }
        
        // Get tasks for this deal
        const tasks = await db.getTasksForDeal(deal.id);
        
        return {
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
      })
    );
    
    return NextResponse.json({ deals: dealsWithRelations });
  } catch (error) {
    console.error('Get deals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withApiSecurity(async (request: NextRequest) => {
  try {
    // Initialize database if not already done
    await db.initialize();
    
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body: CreateDealRequest = await request.json();
    
    // Validate required fields
    if (!body.accountName) {
      return NextResponse.json(
        { error: 'Account name is required' },
        { status: 400 }
      );
    }

    // Add the creator ID to the deal data and convert date string to Date object
    const dealData = {
      ...body,
      createdBy: userPayload.userId,
      renewalDate: body.renewalDate ? new Date(body.renewalDate) : undefined,
      // Convert arrays to comma-separated strings for database storage
      stakeholders: Array.isArray(body.stakeholders) ? body.stakeholders.join(', ') : body.stakeholders,
      productsInUse: Array.isArray(body.productsInUse) ? body.productsInUse.join(', ') : body.productsInUse,
      growthOpportunities: Array.isArray(body.growthOpportunities) ? body.growthOpportunities.join(', ') : body.growthOpportunities
    };

    const deal = await db.createDeal(dealData);
    
    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
