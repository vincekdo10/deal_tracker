import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { db } from '@/services/database';
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

    const { id: dealId } = await params;
    const deal = await db.getDealById(dealId);
    
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Get team members for this deal's team
    let teamMembers = [];
    
    if (deal.teamId) {
      teamMembers = await db.getUsersByTeam(deal.teamId);
    }

    // Always include the assigned Sales Director and creator if they're not already in the team
    const additionalUsers = [];
    
    if (deal.assignedTo) {
      const assignedUser = await db.getUserById(deal.assignedTo);
      if (assignedUser && !teamMembers.find(member => member.id === assignedUser.id)) {
        additionalUsers.push(assignedUser);
      }
    }
    
    if (deal.createdBy) {
      const creator = await db.getUserById(deal.createdBy);
      if (creator && !teamMembers.find(member => member.id === creator.id) && 
          !additionalUsers.find(user => user.id === creator.id)) {
        additionalUsers.push(creator);
      }
    }

    const allMembers = [...teamMembers, ...additionalUsers];

    return NextResponse.json({ teamMembers: allMembers });
  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
