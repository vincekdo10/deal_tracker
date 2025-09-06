'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Priority, TaskStatus } from '@/types';
import { X, Plus } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  dealId: string;
  initialStatus?: TaskStatus;
}

export function CreateTaskModal({ isOpen, onClose, onSuccess, dealId, initialStatus = 'TODO' }: CreateTaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as Priority,
    status: initialStatus as TaskStatus,
    dueDate: '',
    assigneeId: '',
    blockedReason: '',
  });
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch team members for assignee dropdown
      const fetchTeamMembers = async () => {
        try {
          const response = await fetch(`/api/deals/${dealId}/team-members`, {
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
      
      // Reset form with initial status
      setFormData(prev => ({
        ...prev,
        status: initialStatus,
        title: '',
        description: '',
        dueDate: '',
        assigneeId: '',
        blockedReason: '',
      }));
      setSubtasks([]);
      setNewSubtask('');
    }
  }, [isOpen, dealId, initialStatus]);

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/deals/${dealId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          dueDate: formData.dueDate || null,
          assigneeId: formData.assigneeId || null,
          blockedReason: formData.blockedReason || null,
          dealId: dealId, // Add the dealId from props
        }),
      });

      if (response.ok) {
        const taskData = await response.json();
        
        // Create subtasks if any
        if (subtasks.length > 0) {
          if (!taskData.task || !taskData.task.id) {
            console.error('Task ID is missing from response:', taskData);
            setError('Failed to get task ID for subtask creation');
            return;
          }
          
          for (let i = 0; i < subtasks.length; i++) {
            const subtaskData = {
              title: subtasks[i],
              taskId: taskData.task.id,
              position: i + 1,
              status: 'INCOMPLETE',
            };
            
            const subtaskResponse = await fetch('/api/subtasks', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify(subtaskData),
            });
            
            if (!subtaskResponse.ok) {
              const errorData = await subtaskResponse.json();
              console.error('Failed to create subtask:', errorData);
              setError(`Failed to create subtask: ${errorData.error || 'Unknown error'}`);
              return;
            }
          }
        }
        
        onSuccess();
        onClose();
        setFormData({
          title: '',
          description: '',
          priority: 'MEDIUM',
          status: 'TODO',
          dueDate: '',
          assigneeId: '',
          blockedReason: '',
        });
        setSubtasks([]);
        setNewSubtask('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create task');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg bg-white">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Create New Task</CardTitle>
              <CardDescription>Add a new task to this deal</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Enter task title"
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-900">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
                rows={3}
                placeholder="Enter task description"
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
              <Label className="text-gray-900">Subtasks (Optional)</Label>
              <div className="space-y-2 mt-2">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 border rounded-lg bg-gray-50">
                    <span className="flex-1 text-sm text-gray-700">{subtask}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSubtasks(prev => prev.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <div className="flex space-x-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Add subtask"
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

            <div className="grid grid-cols-2 gap-4">
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
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
