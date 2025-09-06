'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getDealStageColor } from '@/lib/utils';
import { DealWithRelations, DealStage, Priority } from '@/types';
import { Plus, Filter, Search, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateDealModal } from '@/components/modals/create-deal-modal';
import { EditDealModal } from '@/components/modals/edit-deal-modal';
import { apiClient } from '@/lib/api-client';

export default function DealsPage() {
  const [deals, setDeals] = useState<DealWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<DealStage | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<DealWithRelations | null>(null);
  const [deletingDeal, setDeletingDeal] = useState<DealWithRelations | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/deals', {
          credentials: 'include', // Include cookies
        });
        if (response.ok) {
          const data = await response.json();
          setDeals(data.deals);
        }
      } catch (error) {
        console.error('Failed to fetch deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  // Handle URL action parameter
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const handleDealCreated = () => {
    // Refresh the deals list
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/deals', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setDeals(data.deals);
        }
      } catch (error) {
        console.error('Failed to fetch deals:', error);
      }
    };
    fetchDeals();
  };

  const handleEditDeal = (deal: DealWithRelations) => {
    setEditingDeal(deal);
    setShowEditModal(true);
  };

  const handleDealUpdated = () => {
    handleDealCreated(); // Refresh the list
    setShowEditModal(false);
    setEditingDeal(null);
  };

  const handleDeleteDeal = (deal: DealWithRelations) => {
    setDeletingDeal(deal);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDeal = async () => {
    if (!deletingDeal) return;

    try {
      await apiClient.delete(`/api/deals/${deletingDeal.id}`);
      // Remove the deal from the local state
      setDeals(prevDeals => prevDeals.filter(deal => deal.id !== deletingDeal.id));
      setShowDeleteConfirm(false);
      setDeletingDeal(null);
    } catch (error) {
      console.error('Failed to delete deal:', error);
      alert('Failed to delete deal. Please try again.');
    }
  };

  const cancelDeleteDeal = () => {
    setShowDeleteConfirm(false);
    setDeletingDeal(null);
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (deal.stakeholders || []).some(stakeholder => 
                           stakeholder.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesStage = stageFilter === 'ALL' || deal.dealStage === stageFilter;
    const matchesPriority = priorityFilter === 'ALL' || deal.dealPriority === priorityFilter;
    
    return matchesSearch && matchesStage && matchesPriority;
  });

  if (loading) {
    return (
      <MainLayout title="Deals">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Deals" subtitle="Manage your deal pipeline">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as DealStage | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Stages</option>
              <option value="PROSPECTING">Prospecting</option>
              <option value="DISCOVERY">Discovery</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="RENEWAL">Renewal</option>
              <option value="CLOSED_WON">Closed Won</option>
              <option value="CLOSED_LOST">Closed Lost</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as Priority | 'ALL')}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Deal
          </Button>
        </div>

        {/* Deals List */}
        <div className="grid grid-cols-1 gap-6">
          {filteredDeals.map((deal) => (
            <Card key={deal.id} className="hover:shadow-lg hover:shadow-blue-100 transition-all duration-200 border border-gray-200 hover:border-blue-300">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{deal.accountName}</CardTitle>
                    <CardDescription>
                      Created by {deal.creator.firstName} {deal.creator.lastName} • {formatDate(deal.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDealStageColor(deal.dealStage)}`}>
                      {deal.dealStage.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDealStageColor(deal.dealPriority)}`}>
                      {deal.dealPriority}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Sales Director</h4>
                    <div className="space-y-1 text-sm">
                      {deal.assignedTo ? (
                        <>
                          <p className="text-gray-600">{deal.assignedTo.firstName} {deal.assignedTo.lastName}</p>
                          <p className="text-gray-500">{deal.assignedTo.email}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-gray-600">{deal.creator.firstName} {deal.creator.lastName}</p>
                          <p className="text-gray-500">{deal.creator.email}</p>
                          <p className="text-xs text-gray-400">(Creator - No SD assigned)</p>
                        </>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-900 mb-2">Products & Growth</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-600">Products:</span> {deal.productsInUse?.length || 0}</p>
                      <p><span className="text-gray-600">Opportunities:</span> {deal.growthOpportunities?.length || 0}</p>
                      <p><span className="text-gray-600">Tasks:</span> {deal.tasks?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Last updated: {formatDate(deal.updatedAt)}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                        <Link href={`/deals/${deal.id}/kanban`}>
                          View Kanban
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700"
                        onClick={() => handleEditDeal(deal)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        onClick={() => handleDeleteDeal(deal)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDeals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">No deals found matching your criteria.</p>
            </CardContent>
          </Card>
        )}

        <CreateDealModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleDealCreated}
        />
        
        <EditDealModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleDealUpdated}
          deal={editingDeal}
        />

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && deletingDeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Deal
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the deal for <strong>{deletingDeal.accountName}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={cancelDeleteDeal}
                  className="hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteDeal}
                  className="hover:bg-red-600"
                >
                  Delete Deal
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
