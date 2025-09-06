'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Priority, TaskStatus, TaskWithSubtasks, SubtaskStatus } from '@/types';
import { X, Plus, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: TaskWithSubtasks | null;
}

export function EditTaskModal({ isOpen, onClose, onSuccess, task }: EditTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    status: 'TODO' as TaskStatus,
    dueDate: '',
    assigneeId: '',
    blockedReason: '',
  });
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority || 'MEDIUM',
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assigneeId: task.assigneeId || '',
        blockedReason: task.blockedReason || '',
      });
      console.log('Task subtasks:', task.subtasks);
      setSubtasks(task.subtasks || []);
      
      // Fetch team members
      if (task.dealId) {
        const fetchTeamMembers = async () => {
          try {
            const response = await fetch(`/api/deals/${task.dealId}/team-members`, {
              credentials: 'include',
            });
            if (response.ok) {
              const data = await response.json();
              setUsers(data.teamMembers || []);
            }
          } catch (error) {
            console.error('Failed to fetch team members:', error);
          }
        };
        fetchTeamMembers();
      }
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
          assigneeId: formData.assigneeId || null,
          blockedReason: formData.blockedReason || null,
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Update task error:', error);
      setError('Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim() || !task) return;

    try {
      const response = await fetch('/api/subtasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: newSubtask.trim(),
          taskId: task.id,
          position: subtasks.length + 1,
          status: 'INCOMPLETE',
        }),
      });

      if (response.ok) {
        const newSubtaskData = await response.json();
        console.log('New subtask data:', newSubtaskData);
        console.log('Current subtasks:', subtasks);
        setSubtasks([...subtasks, newSubtaskData.subtask]);
        setNewSubtask('');
      }
    } catch (error) {
      console.error('Failed to create subtask:', error);
    }
  };

  const handleUpdateSubtaskStatus = async (subtaskId: string, status: SubtaskStatus) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setSubtasks(prev => prev.map(subtask => 
          subtask.id === subtaskId ? { ...subtask, status } : subtask
        ));
      }
    } catch (error) {
      console.error('Failed to update subtask:', error);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/subtasks/${subtaskId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSubtasks(prev => prev.filter(subtask => subtask.id !== subtaskId));
      }
    } catch (error) {
      console.error('Failed to delete subtask:', error);
    }
  };

  const getStatusIcon = (status: SubtaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'BLOCKED':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: SubtaskStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-50';
      case 'BLOCKED':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Edit Task</CardTitle>
              <CardDescription>Update task details and manage subtasks</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-gray-900">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter task title"
                  className="text-gray-900 bg-white"
                />
              </div>

              <div>
                <Label htmlFor="priority" className="text-gray-900">Priority</Label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <Label htmlFor="status" className="text-gray-900">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as TaskStatus })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="BLOCKED">Blocked</option>
                  <option value="DONE">Done</option>
                </select>
              </div>

              <div>
                <Label htmlFor="assigneeId" className="text-gray-900">Assignee</Label>
                <select
                  id="assigneeId"
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="dueDate" className="text-gray-900">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="text-gray-900 bg-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-900">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
              />
            </div>

            {formData.status === 'BLOCKED' && (
              <div>
                <Label htmlFor="blockedReason" className="text-gray-900">Blocking Reason *</Label>
                <textarea
                  id="blockedReason"
                  value={formData.blockedReason}
                  onChange={(e) => setFormData({ ...formData, blockedReason: e.target.value })}
                  placeholder="Explain why this task is blocked"
                  rows={2}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                />
              </div>
            )}

            {/* Subtasks Section */}
            <div>
              <Label className="text-gray-900">Subtasks</Label>
              <div className="space-y-2 mt-2">
                {subtasks.map((subtask, index) => {
                  console.log('Rendering subtask:', subtask, 'index:', index, 'id:', subtask.id);
                  // Create a unique key that combines ID and index to avoid duplicates
                  const uniqueKey = subtask.id ? `${subtask.id}-${index}` : `subtask-${index}-${Date.now()}`;
                  return (
                  <div key={uniqueKey} className="flex items-center space-x-2 p-2 border rounded-lg">
                    <button
                      type="button"
                      onClick={() => handleUpdateSubtaskStatus(
                        subtask.id, 
                        subtask.status === 'COMPLETED' ? 'INCOMPLETE' : 'COMPLETED'
                      )}
                      className="flex-shrink-0"
                    >
                      {getStatusIcon(subtask.status)}
                    </button>
                    <span className={`flex-1 text-sm ${getStatusColor(subtask.status)} px-2 py-1 rounded`}>
                      {subtask.title}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpdateSubtaskStatus(
                          subtask.id, 
                          subtask.status === 'BLOCKED' ? 'INCOMPLETE' : 'BLOCKED'
                        )}
                        className={`text-xs px-2 py-1 ${
                          subtask.status === 'BLOCKED' 
                            ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50' 
                            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {subtask.status === 'BLOCKED' ? 'Unblock' : 'Block'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  );
                })}
                
                <div className="flex space-x-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add new subtask"
                    className="text-gray-900 bg-white"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                  />
                  <Button
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={!newSubtask.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
