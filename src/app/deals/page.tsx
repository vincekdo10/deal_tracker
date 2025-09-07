'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate, getDealStageColor } from '@/lib/utils';
import { DealWithRelations, DealStage, Priority } from '@/types';
import { Plus, Filter, Search, Trash2, Kanban, Calendar, Users, DollarSign, Target, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { CreateDealModal } from '@/components/modals/create-deal-modal';
import { EditDealModal } from '@/components/modals/edit-deal-modal';
import { apiClient } from '@/lib/api-client';
import { LogoPreview } from '@/components/ui/logo-preview';
import { Badge } from '@/components/ui/badge';

// Helper functions
function getPriorityVariant(priority: Priority): 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' {
  switch (priority) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'primary';
    case 'LOW':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getStageProgress(stage: DealStage): number {
  const stageProgress = {
    'ENGAGE': 10,
    'DISCOVER': 25,
    'SCOPE': 40,
    'TECHNICAL_VALIDATION': 55,
    'BUSINESS_JUSTIFICATION': 70,
    'NEGOTIATE': 85,
    'CLOSED_WON': 100,
    'CLOSED_LOST': 0
  };
  return stageProgress[stage] || 0;
}

function getStageDisplayName(stage: DealStage): string {
  const stageNames = {
    'ENGAGE': 'Engage',
    'DISCOVER': 'Discover',
    'SCOPE': 'Scope',
    'TECHNICAL_VALIDATION': 'Technical Validation',
    'BUSINESS_JUSTIFICATION': 'Business Justification',
    'NEGOTIATE': 'Negotiate',
    'CLOSED_WON': 'Closed Won',
    'CLOSED_LOST': 'Closed Lost'
  };
  return stageNames[stage] || stage;
}

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
  const router = useRouter();

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
              <option value="ENGAGE">Engage</option>
              <option value="DISCOVER">Discover</option>
              <option value="SCOPE">Scope</option>
              <option value="TECHNICAL_VALIDATION">Technical Validation</option>
              <option value="BUSINESS_JUSTIFICATION">Business Justification</option>
              <option value="NEGOTIATE">Negotiate</option>
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
        <div className="grid grid-cols-1 gap-4">
          {filteredDeals.map((deal) => (
            <Card 
              key={deal.id} 
              hover 
              className="p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20"
              onClick={() => router.push(`/deals/${deal.id}/kanban`)}
            >
              <div className="space-y-3">
                {/* Header with Logo */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {deal.companyDomain && (
                      <LogoPreview 
                        domain={deal.companyDomain} 
                        size="sm" 
                        className="flex-shrink-0"
                      />
                    )}
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {deal.accountName}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="outline" 
                          size="sm"
                          className="text-xs"
                        >
                          {getStageDisplayName(deal.dealStage)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge variant={getPriorityVariant(deal.dealPriority)} size="sm">
                    {deal.dealPriority}
                  </Badge>
                </div>
                
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-text-tertiary" />
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        ARR
                      </p>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {deal.arr ? formatCurrency(deal.arr) : '—'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <Target className="h-3 w-3 text-text-tertiary" />
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        TAM
                      </p>
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      {deal.tam ? formatCurrency(deal.tam) : '—'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-text-tertiary" />
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        Renewal
                      </p>
                    </div>
                    <p className="text-sm font-medium text-text-secondary">
                      {deal.renewalDate ? formatDate(deal.renewalDate) : '—'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-text-tertiary" />
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        Team
                      </p>
                    </div>
                    <p className="text-sm font-medium text-text-secondary">
                      {deal.team?.name || 'Unassigned'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-text-tertiary" />
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        Sales Director
                      </p>
                    </div>
                    <p className="text-sm font-medium text-text-secondary">
                      {deal.assignedTo ? `${deal.assignedTo.firstName} ${deal.assignedTo.lastName}` : 'Unassigned'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1">
                      <DollarSign className="h-3 w-3 text-text-tertiary" />
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        Economic Buyer
                      </p>
                    </div>
                    <p className="text-sm font-medium text-text-secondary">
                      {deal.eb || '—'}
                    </p>
                  </div>
                </div>
                
                {/* Stakeholders */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                    Stakeholders
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {deal.stakeholders.slice(0, 4).map((stakeholder, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        {stakeholder}
                      </Badge>
                    ))}
                    {deal.stakeholders.length > 4 && (
                      <Badge variant="outline" size="sm">
                        +{deal.stakeholders.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-text-tertiary">Progress</span>
                    <span className="text-xs text-text-secondary">{getStageProgress(deal.dealStage)}%</span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-1.5">
                    <div 
                      className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${getStageProgress(deal.dealStage)}%` }}
                    />
                  </div>
                </div>
                
                {/* Products and Growth Opportunities */}
                <div className="grid grid-cols-1 gap-2">
                  
                  {deal.productsInUse && deal.productsInUse.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        Products in Use
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {deal.productsInUse.slice(0, 2).map((product, index) => (
                          <Badge key={index} variant="outline" size="sm">
                            {product}
                          </Badge>
                        ))}
                        {deal.productsInUse.length > 2 && (
                          <Badge variant="outline" size="sm">
                            +{deal.productsInUse.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {deal.growthOpportunities && deal.growthOpportunities.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                        Growth Opportunities
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {deal.growthOpportunities.slice(0, 2).map((opportunity, index) => (
                          <Badge key={index} variant="secondary" size="sm">
                            {opportunity}
                          </Badge>
                        ))}
                        {deal.growthOpportunities.length > 2 && (
                          <Badge variant="outline" size="sm">
                            +{deal.growthOpportunities.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-1.5 border-t border-border-light">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/deals/${deal.id}/kanban`);
                    }}
                    className="flex items-center space-x-1 h-8 px-3"
                  >
                    <Kanban className="h-3 w-3" />
                    <span className="text-xs">Kanban</span>
                  </Button>
                  
                  <div className="text-xs text-text-tertiary">
                    Click anywhere to open Kanban
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditDeal(deal);
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDeal(deal);
                      }}
                      className="h-8 px-3"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredDeals.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-text-secondary">No deals found matching your criteria.</p>
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
