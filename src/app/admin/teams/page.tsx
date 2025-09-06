'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { TeamWithMembers } from '@/types';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { CreateTeamModal } from '@/components/modals/create-team-modal';
import { EditTeamModal } from '@/components/modals/edit-team-modal';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<TeamWithMembers | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deletingTeam, setDeletingTeam] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<TeamWithMembers | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = () => {
    setShowCreateModal(true);
  };

  const handleEditTeam = (team: TeamWithMembers) => {
    setEditingTeam(team);
    setShowEditModal(true);
  };

  const handleTeamCreated = () => {
    setShowCreateModal(false);
    // Refresh teams list
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      }
    };
    fetchTeams();
  };

  const handleTeamUpdated = () => {
    setShowEditModal(false);
    setEditingTeam(null);
    // Refresh teams list
    const fetchTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams');
        if (response.ok) {
          const data = await response.json();
          setTeams(data.teams);
        }
      } catch (error) {
        console.error('Failed to fetch teams:', error);
      }
    };
    fetchTeams();
  };

  const handleDeleteTeam = (team: TeamWithMembers) => {
    setTeamToDelete(team);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTeam = async () => {
    if (!teamToDelete) return;
    
    setDeletingTeam(teamToDelete.id);
    try {
      const response = await fetch(`/api/admin/teams/${teamToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Remove team from local state
        setTeams(teams.filter(team => team.id !== teamToDelete.id));
        setShowDeleteConfirm(false);
        setTeamToDelete(null);
      } else {
        const errorData = await response.json();
        console.error('Failed to delete team:', errorData.error);
        alert('Failed to delete team: ' + errorData.error);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Error deleting team');
    } finally {
      setDeletingTeam(null);
    }
  };

  const cancelDeleteTeam = () => {
    setShowDeleteConfirm(false);
    setTeamToDelete(null);
  };

  if (loading) {
    return (
      <MainLayout title="Team Management">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Team Management" 
      subtitle="Manage teams and their members"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
            <p className="text-gray-600">Manage teams and their members</p>
          </div>
          <Button onClick={handleCreateTeam} className="hover:bg-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>

        {/* Teams List */}
        <div className="grid grid-cols-1 gap-6">
          {teams.map((team) => {
            const totalArr = team.deals.reduce((sum, deal) => sum + (deal.arr || 0), 0);
            const totalTasks = team.deals.reduce((sum, deal) => sum + deal.tasks.length, 0);
            const completedTasks = team.deals.reduce((sum, deal) => 
              sum + deal.tasks.filter(task => task.status === 'DONE').length, 0
            );

            return (
              <Card key={team.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{team.name}</CardTitle>
                      {team.description && (
                        <CardDescription className="mt-1">{team.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditTeam(team)}
                        className="hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteTeam(team)}
                        disabled={deletingTeam === team.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {deletingTeam === team.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Members */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-3 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Members ({team.userTeams.length})
                      </h4>
                      <div className="space-y-2">
                        {team.userTeams.map((userTeam) => (
                          <div key={userTeam.user.id} className="flex items-center space-x-2">
                            <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-700">
                                {userTeam.user.firstName.charAt(0)}{userTeam.user.lastName.charAt(0)}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {userTeam.user.firstName} {userTeam.user.lastName}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              userTeam.user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              userTeam.user.role === 'SOLUTIONS_ARCHITECT' ? 'bg-blue-100 text-blue-800' :
                              userTeam.user.role === 'SALES_DIRECTOR' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {userTeam.user.role.replace('_', ' ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-3">Performance</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total ARR:</span>
                          <span className="font-medium">{formatCurrency(totalArr)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Deals:</span>
                          <span className="font-medium">{team.deals.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tasks:</span>
                          <span className="font-medium">{totalTasks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-medium">{completedTasks}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-3">Recent Deals</h4>
                      <div className="space-y-2">
                        {team.deals.slice(0, 3).map((deal) => (
                          <div key={deal.id} className="text-sm">
                            <p className="font-medium text-gray-900">{deal.accountName}</p>
                            <p className="text-gray-600">
                              {formatCurrency(deal.arr || 0)} • {deal.dealStage.replace('_', ' ')}
                            </p>
                          </div>
                        ))}
                        {team.deals.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{team.deals.length - 3} more deals
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Created: {formatDate(team.createdAt)}</span>
                      <span>Last updated: {formatDate(team.createdAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {teams.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No teams found.</p>
            </CardContent>
          </Card>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <CreateTeamModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onTeamCreated={handleTeamCreated}
          />
        )}

        {/* Edit Team Modal */}
        {showEditModal && editingTeam && (
          <EditTeamModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setEditingTeam(null);
            }}
            team={editingTeam}
            onTeamUpdated={handleTeamUpdated}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && teamToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Team
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the team "{teamToDelete.name}"? This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-end">
                <Button
                  variant="outline"
                  onClick={cancelDeleteTeam}
                  disabled={deletingTeam === teamToDelete.id}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteTeam}
                  disabled={deletingTeam === teamToDelete.id}
                >
                  {deletingTeam === teamToDelete.id ? 'Deleting...' : 'Delete Team'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
