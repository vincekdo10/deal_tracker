'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp,
  Database,
  Settings,
  BarChart3,
  Shield,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalDeals: number;
  totalArr: number;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  recentActivity: Array<{
    action: string;
    details: string;
    createdAt: string;
  }>;
  systemHealth: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    auth: 'healthy' | 'warning' | 'error';
  };
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/admin/metrics', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setMetrics(data.metrics);
        }
      } catch (error) {
        console.error('Failed to fetch admin metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <MainLayout title="Admin Dashboard">
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

  if (!metrics) {
    return (
      <MainLayout title="Admin Dashboard">
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load admin metrics</p>
        </div>
      </MainLayout>
    );
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <MainLayout title="Admin Dashboard">
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-blue-100">System overview and management tools</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
                  <p className="text-xs text-green-600">{metrics.activeUsers} active</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Deals</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalDeals}</p>
                  <p className="text-xs text-blue-600">{formatCurrency(metrics.totalArr)} ARR</p>
                </div>
                <Briefcase className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalTasks}</p>
                  <p className="text-xs text-green-600">{metrics.completedTasks} completed</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Blocked Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.blockedTasks}</p>
                  <p className="text-xs text-red-600">{metrics.overdueTasks} overdue</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Health & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                System Health
              </CardTitle>
              <CardDescription>Current system status and health indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <Database className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="font-medium">Database</span>
                  </div>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(metrics.systemHealth.database)}`}>
                    {getHealthIcon(metrics.systemHealth.database)}
                    <span className="ml-1 capitalize">{metrics.systemHealth.database}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <Activity className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="font-medium">API Services</span>
                  </div>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(metrics.systemHealth.api)}`}>
                    {getHealthIcon(metrics.systemHealth.api)}
                    <span className="ml-1 capitalize">{metrics.systemHealth.api}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-3 text-gray-500" />
                    <span className="font-medium">Authentication</span>
                  </div>
                  <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getHealthColor(metrics.systemHealth.auth)}`}>
                    {getHealthIcon(metrics.systemHealth.auth)}
                    <span className="ml-1 capitalize">{metrics.systemHealth.auth}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300">
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Users</span>
                  </Button>
                </Link>

                <Link href="/admin/teams">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-300">
                    <UserCheck className="h-6 w-6 mb-2" />
                    <span className="text-sm">Manage Teams</span>
                  </Button>
                </Link>

                <Link href="/admin/analytics">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-300">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span className="text-sm">Analytics</span>
                  </Button>
                </Link>

                <Link href="/admin/system">
                  <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center hover:bg-orange-50 hover:border-orange-300">
                    <Database className="h-6 w-6 mb-2" />
                    <span className="text-sm">System Tools</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.length > 0 ? (
                metrics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.details}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(activity.createdAt)}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
