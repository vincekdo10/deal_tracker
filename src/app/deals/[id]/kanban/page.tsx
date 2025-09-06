'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/main-layout';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getDealStageColor } from '@/lib/utils';
import { DealWithRelations, TaskWithSubtasks, TaskStatus } from '@/types';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';
import { CreateTaskModal } from '@/components/modals/create-task-modal';
import { EditTaskModal } from '@/components/modals/edit-task-modal';

export default function DealKanbanPage() {
  const params = useParams();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<DealWithRelations | null>(null);
  const [tasks, setTasks] = useState<TaskWithSubtasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus>('TODO');
  const [editingTask, setEditingTask] = useState<TaskWithSubtasks | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const fetchDealAndTasks = async () => {
      try {
        const [dealResponse, tasksResponse] = await Promise.all([
          fetch(`/api/deals/${dealId}`),
          fetch(`/api/deals/${dealId}/tasks`)
        ]);

        if (dealResponse.ok) {
          const dealData = await dealResponse.json();
          setDeal(dealData.deal);
        }

        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json();
          setTasks(tasksData.tasks);
        }
      } catch (error) {
        console.error('Failed to fetch deal data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (dealId) {
      fetchDealAndTasks();
    }
  }, [dealId]);

  const handleTaskUpdate = (taskId: string, updates: Partial<TaskWithSubtasks>) => {
    // If the update contains only an id, it means the task was deleted
    if (updates.id === taskId && Object.keys(updates).length === 1) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
      return;
    }
    
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleTaskCreated = () => {
    // Refresh the tasks list
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/deals/${dealId}/tasks`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    fetchTasks();
    setShowCreateModal(false);
  };

  const handleCreateTask = (status: TaskStatus) => {
    setCreateModalStatus(status);
    setShowCreateModal(true);
  };

  const handleEditTask = (task: TaskWithSubtasks) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleTaskUpdated = () => {
    // Refresh the tasks list
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/deals/${dealId}/tasks`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setTasks(data.tasks);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      }
    };
    fetchTasks();
    setShowEditModal(false);
    setEditingTask(null);
  };

  if (loading) {
    return (
      <MainLayout title="Loading...">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
        </div>
      </MainLayout>
    );
  }

  if (!deal) {
    return (
      <MainLayout title="Deal Not Found">
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500">Deal not found or you don't have access to it.</p>
            <Button asChild className="mt-4">
              <Link href="/deals">Back to Deals</Link>
            </Button>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={`${deal.accountName} - Kanban Board`}
      subtitle="Manage tasks and track progress"
    >
      <div className="space-y-6">
        {/* Deal Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild className="hover:bg-gray-100 hover:text-gray-900">
                  <Link href="/deals">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Deals
                  </Link>
                </Button>
                <div>
                  <CardTitle className="text-2xl">{deal.accountName}</CardTitle>
                  <CardDescription>
                    Created by {deal.creator?.firstName || 'Unknown'} {deal.creator?.lastName || 'User'} • {formatDate(deal.createdAt)}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDealStageColor(deal.dealStage)}`}>
                  {deal.dealStage.replace('_', ' ')}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDealStageColor(deal.dealPriority)}`}>
                  {deal.dealPriority}
                </span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Financials</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">ARR:</span> {formatCurrency(deal.arr || 0)}</p>
                  <p><span className="text-gray-600">TAM:</span> {formatCurrency(deal.tam || 0)}</p>
                  {deal.renewalDate && (
                    <p><span className="text-gray-600">Renewal:</span> {formatDate(deal.renewalDate)}</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Stakeholders</h4>
                <div className="space-y-1 text-sm">
                  {(deal.stakeholders || []).slice(0, 3).map((stakeholder, index) => (
                    <p key={index} className="text-gray-600">{stakeholder}</p>
                  ))}
                  {(deal.stakeholders || []).length > 3 && (
                    <p className="text-gray-500">+{(deal.stakeholders || []).length - 3} more</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Products</h4>
                <div className="space-y-1 text-sm">
                  {(deal.productsInUse || []).slice(0, 3).map((product, index) => (
                    <p key={index} className="text-gray-600">{product}</p>
                  ))}
                  {(deal.productsInUse || []).length > 3 && (
                    <p className="text-gray-500">+{(deal.productsInUse || []).length - 3} more</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Growth Opportunities</h4>
                <div className="space-y-1 text-sm">
                  {(deal.growthOpportunities || []).slice(0, 3).map((opportunity, index) => (
                    <p key={index} className="text-gray-600">{opportunity}</p>
                  ))}
                  {(deal.growthOpportunities || []).length > 3 && (
                    <p className="text-gray-500">+{(deal.growthOpportunities || []).length - 3} more</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm text-gray-900 mb-2">Sales Director</h4>
                <div className="space-y-1 text-sm">
                  {deal.assignedTo ? (
                    <>
                      <p className="text-gray-600">{deal.assignedTo.firstName} {deal.assignedTo.lastName}</p>
                      <p className="text-gray-500">{deal.assignedTo.email}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600">{deal.creator?.firstName || 'Unknown'} {deal.creator?.lastName || 'User'}</p>
                      <p className="text-gray-500">{deal.creator?.email || 'No SD assigned'}</p>
                      <p className="text-xs text-gray-400">(Creator - No SD assigned)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kanban Board */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Task Management</CardTitle>
                <CardDescription>
                  Drag and drop tasks between columns to update their status
                </CardDescription>
              </div>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <KanbanBoard
              dealId={dealId}
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onCreateTask={handleCreateTask}
              onEditTask={handleEditTask}
            />
          </CardContent>
        </Card>

        <CreateTaskModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTaskCreated}
          dealId={dealId}
          initialStatus={createModalStatus}
        />

        <EditTaskModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleTaskUpdated}
          task={editingTask}
        />
      </div>
    </MainLayout>
  );
}
