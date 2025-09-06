'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { DashboardMetrics } from '@/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/dashboard/metrics', {
          credentials: 'include', // Include cookies
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <MainLayout title="Dashboard">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard" subtitle="Overview of your deals and tasks">
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg hover:shadow-blue-100 transition-all duration-200 border border-gray-200 hover:border-blue-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total ARR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(metrics?.totalArr || 0)}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:shadow-green-100 transition-all duration-200 border border-gray-200 hover:border-green-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.activeDeals || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:shadow-yellow-100 transition-all duration-200 border border-gray-200 hover:border-yellow-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.openTasks || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg hover:shadow-red-100 transition-all duration-200 border border-gray-200 hover:border-red-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {metrics?.overdueTasks || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deals */}
        {metrics?.deals && metrics.deals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Deals</CardTitle>
              <CardDescription>
                {metrics.deals.length === 1 ? '1 deal' : `${metrics.deals.length} deals`} in your pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.deals.slice(0, 5).map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-lg">{deal.accountName}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          deal.dealStage === 'PROSPECTING' ? 'bg-blue-100 text-blue-800' :
                          deal.dealStage === 'DISCOVERY' ? 'bg-yellow-100 text-yellow-800' :
                          deal.dealStage === 'PROPOSAL' ? 'bg-purple-100 text-purple-800' :
                          deal.dealStage === 'NEGOTIATION' ? 'bg-orange-100 text-orange-800' :
                          deal.dealStage === 'RENEWAL' ? 'bg-indigo-100 text-indigo-800' :
                          deal.dealStage === 'CLOSED_WON' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.dealStage.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          deal.dealPriority === 'HIGH' ? 'bg-red-100 text-red-800' :
                          deal.dealPriority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {deal.dealPriority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {deal.stakeholders && deal.stakeholders.length > 0 
                          ? `Stakeholders: ${deal.stakeholders.join(', ')}`
                          : 'No stakeholders listed'
                        }
                      </p>
                      {deal.renewalDate && (
                        <p className="text-sm text-gray-500 mt-1">
                          Renewal: {new Date(deal.renewalDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{formatCurrency(deal.arr)}</p>
                      <p className="text-sm text-gray-600">ARR</p>
                      <button
                        onClick={() => router.push(`/deals/${deal.id}/kanban`)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Kanban →
                      </button>
                    </div>
                  </div>
                ))}
                {metrics.deals.length > 5 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => router.push('/deals')}
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View all {metrics.deals.length} deals →
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Performance (for Solutions Architects) */}
        {metrics?.teamPerformance && metrics.teamPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>
                Performance breakdown by sales rep
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.teamPerformance.map((team) => (
                  <div key={team.teamId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{team.teamName}</h3>
                      <p className="text-sm text-gray-600">
                        {team.dealCount} deals • {team.taskCount} tasks
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(team.totalArr)}</p>
                      <p className="text-sm text-gray-600">ARR</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  // This will trigger the create deal modal on the deals page
                  router.push('/deals?action=create');
                }}
                className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
              >
                <h3 className="font-medium">Create New Deal</h3>
                <p className="text-sm text-gray-600">Start tracking a new opportunity</p>
              </button>
              
              <button
                onClick={() => router.push('/deals')}
                className="p-4 border rounded-lg hover:bg-green-50 hover:border-green-300 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
              >
                <h3 className="font-medium">View All Deals</h3>
                <p className="text-sm text-gray-600">Browse your deal pipeline</p>
              </button>
              
              <button
                onClick={() => router.push('/deals?filter=blocked')}
                className="p-4 border rounded-lg hover:bg-red-50 hover:border-red-300 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
              >
                <h3 className="font-medium">Blocked Tasks</h3>
                <p className="text-sm text-gray-600">Review and unblock tasks</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
