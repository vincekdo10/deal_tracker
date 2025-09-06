'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Briefcase, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  dealMetrics: {
    totalDeals: number;
    totalArr: number;
    dealsByStage: Record<string, number>;
    dealsByPriority: Record<string, number>;
    monthlyArr: Array<{ month: string; arr: number }>;
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    tasksByStatus: Record<string, number>;
    completionRate: number;
  };
  userMetrics: {
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    userActivity: Array<{ user: string; deals: number; tasks: number }>;
  };
  teamPerformance: Array<{
    teamName: string;
    totalArr: number;
    dealCount: number;
    completionRate: number;
  }>;
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/admin/analytics?range=${timeRange}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data.analytics);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <MainLayout title="Analytics">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!analytics) {
    return (
      <MainLayout title="Analytics">
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load analytics data</p>
        </div>
      </MainLayout>
    );
  }

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'PROSPECTING': 'bg-blue-100 text-blue-800',
      'DISCOVERY': 'bg-yellow-100 text-yellow-800',
      'PROPOSAL': 'bg-orange-100 text-orange-800',
      'NEGOTIATION': 'bg-purple-100 text-purple-800',
      'RENEWAL': 'bg-indigo-100 text-indigo-800',
      'CLOSED_WON': 'bg-green-100 text-green-800',
      'CLOSED_LOST': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'LOW': 'bg-gray-100 text-gray-800',
      'MEDIUM': 'bg-blue-100 text-blue-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'CRITICAL': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <MainLayout title="Analytics">
      <div className="space-y-6">
        {/* Header with Time Range Selector */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights and performance metrics</p>
          </div>
          <div className="flex space-x-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange(range)}
                className="hover:bg-blue-50"
              >
                {range.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total ARR</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(analytics.dealMetrics.totalArr)}
                  </p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    +12% from last period
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Deals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.dealMetrics.totalDeals}
                  </p>
                  <p className="text-xs text-blue-600">
                    {Object.values(analytics.dealMetrics.dealsByStage).reduce((a, b) => a + b, 0)} total
                  </p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Task Completion</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.taskMetrics.completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-purple-600">
                    {analytics.taskMetrics.completedTasks} of {analytics.taskMetrics.totalTasks} tasks
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.userMetrics.activeUsers}
                  </p>
                  <p className="text-xs text-orange-600">
                    {analytics.userMetrics.totalUsers} total users
                  </p>
                </div>
                <Users className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deals by Stage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Deals by Stage
              </CardTitle>
              <CardDescription>Distribution of deals across different stages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.dealMetrics.dealsByStage).map(([stage, count]) => (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${getStageColor(stage).split(' ')[0]}`}></div>
                      <span className="text-sm font-medium capitalize">
                        {stage.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{count}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(stage)}`}>
                        {((count / analytics.dealMetrics.totalDeals) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Task Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Task Status Distribution
              </CardTitle>
              <CardDescription>Current status of all tasks in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics.taskMetrics.tasksByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        status === 'DONE' ? 'bg-green-500' :
                        status === 'IN_PROGRESS' ? 'bg-blue-500' :
                        status === 'BLOCKED' ? 'bg-red-500' :
                        'bg-gray-500'
                      }`}></div>
                      <span className="text-sm font-medium capitalize">
                        {status.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold">{count}</span>
                      <span className="text-xs text-gray-500">
                        {((count / analytics.taskMetrics.totalTasks) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Team Performance
            </CardTitle>
            <CardDescription>Performance metrics by team and sales rep</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Team</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Total ARR</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Deals</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Completion Rate</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.teamPerformance.map((team, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{team.teamName}</td>
                      <td className="py-3 px-4">{formatCurrency(team.totalArr)}</td>
                      <td className="py-3 px-4">{team.dealCount}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${team.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm">{team.completionRate.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          team.completionRate >= 80 ? 'bg-green-100 text-green-800' :
                          team.completionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {team.completionRate >= 80 ? 'Excellent' :
                           team.completionRate >= 60 ? 'Good' : 'Needs Attention'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              User Activity Summary
            </CardTitle>
            <CardDescription>Individual user performance and activity levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.userMetrics.userActivity.map((user, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{user.user}</h4>
                    <span className="text-sm text-gray-500">{user.deals} deals</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{user.tasks} tasks</span>
                    <span className="text-green-600">
                      {user.tasks > 0 ? ((user.tasks / (user.tasks + 5)) * 100).toFixed(0) : 0}% active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
