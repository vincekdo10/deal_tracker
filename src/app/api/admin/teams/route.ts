import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageTeams } from '@/lib/auth';
import { db } from '@/services/database';
import { withApiSecurity } from '@/lib/secure-api';

export const GET = withApiSecurity(async (request: NextRequest) => {

  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!canManageTeams(userPayload.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const teams = await db.getAllTeams();
    
    // Get teams with their members and deals
    const teamsWithDetails = await Promise.all(
      teams.map(async (team) => {
        // Get team members
        const members = await db.getTeamMembers(team.id);
        const userTeams = members.map(user => ({ user }));
        
        // Get team deals - we need to get deals where team_id matches
        const allDeals = await db.getAllDeals();
        const deals = allDeals.filter(deal => deal.teamId === team.id);
        const dealsWithTasks = await Promise.all(
          deals.map(async (deal) => {
            const tasks = await db.getTasksForDeal(deal.id);
            return { ...deal, tasks };
          })
        );
        
        return {
          ...team,
          userTeams,
          deals: dealsWithTasks
        };
      })
    );

    const validTeams = teamsWithDetails.filter(team => team !== null) as any[];
    
    return NextResponse.json({ teams: validTeams });
  } catch (error) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = async (request: NextRequest) => {

  try {
    const userPayload = getUserFromRequest(request);
    
    if (!userPayload) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!canManageTeams(userPayload.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, memberIds } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const teamData = {
      name,
      description: description || '',
      memberIds: memberIds || []
    };

    const newTeam = await db.createTeam(teamData);
    
    return NextResponse.json({ team: newTeam });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};
