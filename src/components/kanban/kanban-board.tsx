'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskWithSubtasks, TaskStatus, Priority } from '@/types';
import { formatDate, getStatusColor, getProgressPercentage } from '@/lib/utils';
import { Plus, MoreHorizontal, CheckCircle2, Clock, AlertCircle, XCircle, Trash2 } from 'lucide-react';

interface KanbanBoardProps {
  dealId: string;
  tasks: TaskWithSubtasks[];
  onTaskUpdate?: (taskId: string, updates: Partial<TaskWithSubtasks>) => void;
  onTaskCreate?: (task: Omit<TaskWithSubtasks, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCreateTask?: (status: TaskStatus) => void;
  onEditTask?: (task: TaskWithSubtasks) => void;
}

const columns = [
  { id: 'TODO' as TaskStatus, title: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS' as TaskStatus, title: 'In Progress', color: 'bg-blue-100' },
  { id: 'BLOCKED' as TaskStatus, title: 'Blocked', color: 'bg-red-100' },
  { id: 'DONE' as TaskStatus, title: 'Done', color: 'bg-green-100' },
];

const statusIcons = {
  TODO: Clock,
  IN_PROGRESS: Clock,
  BLOCKED: AlertCircle,
  DONE: CheckCircle2,
};

const priorityIcons = {
  LOW: XCircle,
  MEDIUM: Clock,
  HIGH: AlertCircle,
  CRITICAL: AlertCircle,
};

export function KanbanBoard({ dealId, tasks, onTaskUpdate, onTaskCreate, onCreateTask, onEditTask }: KanbanBoardProps) {
  const [taskColumns, setTaskColumns] = useState<Record<TaskStatus, TaskWithSubtasks[]>>({
    TODO: [],
    IN_PROGRESS: [],
    BLOCKED: [],
    DONE: [],
  });
  const [deletingTask, setDeletingTask] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Group tasks by status
    const grouped = tasks.reduce((acc, task) => {
      acc[task.status].push(task);
      return acc;
    }, {
      TODO: [] as TaskWithSubtasks[],
      IN_PROGRESS: [] as TaskWithSubtasks[],
      BLOCKED: [] as TaskWithSubtasks[],
      DONE: [] as TaskWithSubtasks[],
    });

    // Sort tasks by position within each column
    const sortedGrouped = Object.keys(grouped).reduce((acc, status) => {
      acc[status as TaskStatus] = [...grouped[status as TaskStatus]].sort((a, b) => a.position - b.position);
      return acc;
    }, {} as Record<TaskStatus, TaskWithSubtasks[]>);

    setTaskColumns(sortedGrouped);
  }, [tasks]);

  const handleTaskMove = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Update local state immediately for optimistic UI
    setTaskColumns(prev => {
      const newColumns = { ...prev };
      
      // Remove from old column
      newColumns[task.status] = newColumns[task.status].filter(t => t.id !== taskId);
      
      // Add to new column
      const updatedTask = { ...task, status: newStatus };
      newColumns[newStatus] = [...newColumns[newStatus], updatedTask];
      
      return newColumns;
    });

    // Update on server
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      onTaskUpdate?.(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert optimistic update
      setTaskColumns(prev => {
        const newColumns = { ...prev };
        newColumns[newStatus] = newColumns[newStatus].filter(t => t.id !== taskId);
        newColumns[task.status] = [...newColumns[task.status], task];
        return newColumns;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleTaskMove(taskId, targetStatus);
    }
  };

  const handleBlockTask = async (taskId: string, reason: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        const updatedTask = await response.json();
        onTaskUpdate?.(taskId, updatedTask.task);
      }
    } catch (error) {
      console.error('Failed to block task:', error);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setDeletingTask(taskId);
    setShowDeleteConfirm(true);
  };

  const toggleSubtasks = (taskId: string) => {
    setExpandedSubtasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const confirmDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      const response = await fetch(`/api/tasks/${deletingTask}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        // Remove task from local state
        setTaskColumns(prev => {
          const newColumns = { ...prev };
          Object.keys(newColumns).forEach(status => {
            newColumns[status as TaskStatus] = newColumns[status as TaskStatus].filter(
              task => task.id !== deletingTask
            );
          });
          return newColumns;
        });

        // Call parent callback if provided
        onTaskUpdate?.(deletingTask, { id: deletingTask } as any);
      } else {
        console.error('Failed to delete task');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setShowDeleteConfirm(false);
      setDeletingTask(null);
    }
  };

  const cancelDeleteTask = () => {
    setShowDeleteConfirm(false);
    setDeletingTask(null);
  };

  return (
    <div className="flex space-x-6 overflow-x-auto pb-6 px-2 kanban-scroll">
      {columns.map((column) => {
        const StatusIcon = statusIcons[column.id];
        const tasks = taskColumns[column.id];

        return (
          <div 
            key={column.id} 
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIcon className="h-4 w-4" />
                    <CardTitle className="text-sm font-medium">
                      {column.title}
                    </CardTitle>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {tasks.length}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => onCreateTask?.(column.id)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {tasks.map((task) => {
                  const PriorityIcon = priorityIcons[task.priority || 'LOW'];
                  const subtasks = task.subtasks || [];
                  const completedSubtasks = subtasks.filter(s => s.status === 'COMPLETE').length;
                  const totalSubtasks = subtasks.length;
                  const progress = getProgressPercentage(completedSubtasks, totalSubtasks);
                  

                  return (
                    <div
                      key={task.id}
                      className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 cursor-move hover:scale-[1.02]"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('taskId', task.id);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const draggedTaskId = e.dataTransfer.getData('taskId');
                        if (draggedTaskId !== task.id) {
                          handleTaskMove(draggedTaskId, column.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {task.title}
                          </h4>
                          {totalSubtasks > 0 && (
                            <div className="flex items-center space-x-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                              <span>Auto</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 hover:bg-gray-100 hover:text-gray-900"
                            onClick={() => onEditTask?.(task)}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.priority && (
                        <div className="flex items-center space-x-1 mb-2">
                          <PriorityIcon className="h-3 w-3 text-gray-400" />
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                      )}

                      {/* Subtasks Section */}
                      <div className="mb-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <button
                            onClick={() => toggleSubtasks(task.id)}
                            className="flex items-center space-x-1 hover:text-gray-800 transition-colors"
                          >
                            <span>Subtasks</span>
                            <span className="text-gray-400">({totalSubtasks})</span>
                            <svg 
                              className={`w-3 h-3 transition-transform ${expandedSubtasks.has(task.id) ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <span>{completedSubtasks}/{totalSubtasks}</span>
                        </div>
                        
                        {totalSubtasks > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                        
                        {/* Subtasks List */}
                        {expandedSubtasks.has(task.id) && (
                            <div className="space-y-1 bg-gray-50 rounded-md p-2 border border-gray-200">
                              {subtasks.length > 0 ? (
                                subtasks.map((subtask, index) => {
                                  return (
                                    <div key={subtask.id || `subtask-${index}`} className="flex items-center space-x-2 text-xs">
                                  <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                                    subtask.status === 'COMPLETE' 
                                      ? 'bg-green-100 text-green-600' 
                                      : subtask.status === 'BLOCKED'
                                      ? 'bg-red-100 text-red-600'
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {subtask.status === 'COMPLETE' ? (
                                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : subtask.status === 'BLOCKED' ? (
                                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                    )}
                                  </div>
                                  <span className={`flex-1 truncate ${
                                    subtask.status === 'COMPLETE' 
                                      ? 'text-gray-500 line-through' 
                                      : 'text-gray-700'
                                  }`}>
                                    {subtask.title || `[No title - ID: ${subtask.id}]`}
                                  </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-xs text-gray-500 italic text-center py-2">
                                  No subtasks yet
                                </div>
                              )}
                            </div>
                        )}
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(task.dueDate)}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        {task.assignee && task.assignee.firstName && task.assignee.lastName ? (
                          <>
                            <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-700">
                                {task.assignee.firstName.charAt(0)}{task.assignee.lastName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-600">
                              {task.assignee.firstName} {task.assignee.lastName}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-500">?</span>
                            </div>
                            <span className="text-xs text-gray-500 italic">Unassigned</span>
                          </>
                        )}
                      </div>

                      {task.status === 'BLOCKED' && task.blockedReason && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          <strong>Blocked:</strong> {task.blockedReason}
                        </div>
                      )}
                    </div>
                  );
                })}

                {tasks.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No tasks in this column</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 hover:bg-gray-100 hover:text-gray-900"
                      onClick={() => onCreateTask?.(column.id)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );
      })}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={cancelDeleteTask}
                className="hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteTask}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Task
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
