'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Server,
  Settings
} from 'lucide-react';

interface SystemInfo {
  database: {
    type: string;
    size: string;
    status: 'healthy' | 'warning' | 'error';
    lastBackup?: string;
  };
  api: {
    version: string;
    uptime: string;
    status: 'healthy' | 'warning' | 'error';
  };
  storage: {
    used: string;
    total: string;
    percentage: number;
  };
}

export default function AdminSystemPage() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const response = await fetch('/api/admin/system/info', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setSystemInfo(data.systemInfo);
        }
      } catch (error) {
        console.error('Failed to fetch system info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/system/${action}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message || 'Action completed successfully' });
        
        // Refresh system info after certain actions
        if (['seed', 'reset', 'backup'].includes(action)) {
          window.location.reload();
        }
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Action failed' });
      }
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
      setMessage({ type: 'error', text: 'Action failed due to network error' });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <MainLayout title="System Tools">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </MainLayout>
    );
  }

  if (!systemInfo) {
    return (
      <MainLayout title="System Tools">
        <div className="text-center py-8">
          <p className="text-gray-500">Failed to load system information</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="System Tools">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">System Tools</h1>
          <p className="text-orange-100">Database management and system administration</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Database className="h-8 w-8 text-blue-600" />
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemInfo.database.status)}`}>
                  {getStatusIcon(systemInfo.database.status)}
                  <span className="ml-1 capitalize">{systemInfo.database.status}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <p className="text-lg font-bold text-gray-900">{systemInfo.database.type}</p>
                <p className="text-xs text-gray-500">Size: {systemInfo.database.size}</p>
                {systemInfo.database.lastBackup && (
                  <p className="text-xs text-gray-500">Last backup: {systemInfo.database.lastBackup}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Server className="h-8 w-8 text-green-600" />
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemInfo.api.status)}`}>
                  {getStatusIcon(systemInfo.api.status)}
                  <span className="ml-1 capitalize">{systemInfo.api.status}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">API Server</p>
                <p className="text-lg font-bold text-gray-900">v{systemInfo.api.version}</p>
                <p className="text-xs text-gray-500">Uptime: {systemInfo.api.uptime}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <HardDrive className="h-8 w-8 text-purple-600" />
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  systemInfo.storage.percentage > 80 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
                }`}>
                  <HardDrive className="h-4 w-4" />
                  <span className="ml-1">{systemInfo.storage.percentage}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Storage</p>
                <p className="text-lg font-bold text-gray-900">{systemInfo.storage.used} / {systemInfo.storage.total}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      systemInfo.storage.percentage > 80 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${systemInfo.storage.percentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Management
            </CardTitle>
            <CardDescription>Manage database operations and data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => handleAction('seed')}
                disabled={actionLoading === 'seed'}
                className="h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-300"
                variant="outline"
              >
                {actionLoading === 'seed' ? (
                  <RefreshCw className="h-6 w-6 mb-2 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6 mb-2" />
                )}
                <span className="text-sm">Seed Database</span>
              </Button>

              <Button
                onClick={() => handleAction('backup')}
                disabled={actionLoading === 'backup'}
                className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-300"
                variant="outline"
              >
                {actionLoading === 'backup' ? (
                  <RefreshCw className="h-6 w-6 mb-2 animate-spin" />
                ) : (
                  <Download className="h-6 w-6 mb-2" />
                )}
                <span className="text-sm">Create Backup</span>
              </Button>

              <Button
                onClick={() => handleAction('reset')}
                disabled={actionLoading === 'reset'}
                className="h-20 flex flex-col items-center justify-center hover:bg-red-50 hover:border-red-300"
                variant="outline"
              >
                {actionLoading === 'reset' ? (
                  <RefreshCw className="h-6 w-6 mb-2 animate-spin" />
                ) : (
                  <Trash2 className="h-6 w-6 mb-2" />
                )}
                <span className="text-sm">Reset Database</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              System Maintenance
            </CardTitle>
            <CardDescription>System maintenance and optimization tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                onClick={() => handleAction('optimize')}
                disabled={actionLoading === 'optimize'}
                className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-300"
                variant="outline"
              >
                {actionLoading === 'optimize' ? (
                  <RefreshCw className="h-6 w-6 mb-2 animate-spin" />
                ) : (
                  <Settings className="h-6 w-6 mb-2" />
                )}
                <span className="text-sm">Optimize Database</span>
              </Button>

              <Button
                onClick={() => handleAction('cleanup')}
                disabled={actionLoading === 'cleanup'}
                className="h-20 flex flex-col items-center justify-center hover:bg-orange-50 hover:border-orange-300"
                variant="outline"
              >
                {actionLoading === 'cleanup' ? (
                  <RefreshCw className="h-6 w-6 mb-2 animate-spin" />
                ) : (
                  <Trash2 className="h-6 w-6 mb-2" />
                )}
                <span className="text-sm">Cleanup Logs</span>
              </Button>

              <Button
                onClick={() => handleAction('health-check')}
                disabled={actionLoading === 'health-check'}
                className="h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-300"
                variant="outline"
              >
                {actionLoading === 'health-check' ? (
                  <RefreshCw className="h-6 w-6 mb-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-6 w-6 mb-2" />
                )}
                <span className="text-sm">Health Check</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning Section */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Important Notice</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Database operations like reset and seed will affect all data. Please ensure you have proper backups before proceeding with destructive operations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
