import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, canManageUsers } from '@/lib/auth';
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

    if (!canManageUsers(userPayload.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('range') || '30d';

    // Get all data
    const users = await db.getAllUsers();
    const deals = await db.getAllDeals();
    const tasks = await db.getAllTasks();

    // Deal metrics
    const totalDeals = deals.length;
    const totalArr = deals.reduce((sum, deal) => sum + (deal.arr || 0), 0);
    
    const dealsByStage = deals.reduce((acc, deal) => {
      acc[deal.dealStage] = (acc[deal.dealStage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dealsByPriority = deals.reduce((acc, deal) => {
      acc[deal.dealPriority] = (acc[deal.dealPriority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate monthly ARR based on actual data
    const monthlyArr = deals.reduce((acc, deal) => {
      const month = new Date(deal.createdAt).toLocaleDateString('en-US', { month: 'short' });
      const existing = acc.find(item => item.month === month);
      if (existing) {
        existing.arr += deal.arr || 0;
      } else {
        acc.push({ month, arr: deal.arr || 0 });
      }
      return acc;
    }, [] as Array<{ month: string; arr: number }>);

    // Task metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'DONE').length;
    const blockedTasks = tasks.filter(task => task.status === 'BLOCKED').length;
    const overdueTasks = tasks.filter(task => 
      task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE'
    ).length;

    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // User metrics
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.isActive).length;

    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate real user activity data
    const userActivity = users.map(user => {
      const userDeals = deals.filter(deal => deal.createdBy === user.id).length;
      const userTasks = tasks.filter(task => task.assigneeId === user.id).length;
      return {
        user: `${user.firstName} ${user.lastName}`,
        deals: userDeals,
        tasks: userTasks
      };
    });

    // Calculate real team performance data
    const teams = await db.getAllTeams();
    const teamPerformance = teams.map(team => {
      const teamDeals = deals.filter(deal => deal.teamId === team.id);
      const teamTasks = tasks.filter(task => teamDeals.some(deal => deal.id === task.dealId));
      const completedTasks = teamTasks.filter(task => task.status === 'DONE').length;
      const totalArr = teamDeals.reduce((sum, deal) => sum + (deal.arr || 0), 0);
      const completionRate = teamTasks.length > 0 ? (completedTasks / teamTasks.length) * 100 : 0;
      
      return {
        teamName: team.name,
        totalArr,
        dealCount: teamDeals.length,
        completionRate: Math.round(completionRate)
      };
    });

    const analytics = {
      dealMetrics: {
        totalDeals,
        totalArr,
        dealsByStage,
        dealsByPriority,
        monthlyArr
      },
      taskMetrics: {
        totalTasks,
        completedTasks,
        blockedTasks,
        overdueTasks,
        tasksByStatus,
        completionRate
      },
      userMetrics: {
        totalUsers,
        activeUsers,
        usersByRole,
        userActivity
      },
      teamPerformance
    };

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }

});
