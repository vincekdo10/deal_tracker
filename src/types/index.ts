// Define all types locally instead of importing from Prisma

// Base enums
export type UserRole = 'ADMIN' | 'SOLUTIONS_ARCHITECT' | 'SALES_DIRECTOR';
export type AuthType = 'SNOWFLAKE' | 'APP';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
export type SubtaskStatus = 'INCOMPLETE' | 'COMPLETE' | 'BLOCKED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type DealStage = 'PROSPECTING' | 'DISCOVERY' | 'PROPOSAL' | 'NEGOTIATION' | 'RENEWAL' | 'CLOSED_WON' | 'CLOSED_LOST';
export type EntityType = 'USER' | 'TEAM' | 'DEAL' | 'TASK' | 'SUBTASK';

// Base entity interfaces
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  authType: AuthType;
  passwordHash: string | null;
  isActive: boolean;
  isTemporaryPassword: boolean;
  passwordChangedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export interface Deal {
  id: string;
  accountName: string;
  stakeholders: string[];
  renewalDate?: string;
  arr: number;
  tam: number;
  dealPriority: Priority;
  dealStage: DealStage;
  productsInUse: string[];
  growthOpportunities: string[];
  teamId?: string | null;
  createdBy: string;
  assignedTo?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  blockedReason?: string;
  position: number;
  dealId: string;
  assigneeId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  status: SubtaskStatus;
  blockedReason?: string;
  position: number;
  taskId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: EntityType;
  entityId: string;
  userId: string;
  details: string;
  createdAt: Date;
}

// Extended types with parsed JSON fields
export interface DealWithRelations extends Omit<Deal, 'stakeholders' | 'productsInUse' | 'growthOpportunities'> {
  stakeholders: string[];
  productsInUse: string[];
  growthOpportunities: string[];
  team: Team;
  creator: User;
  tasks: TaskWithSubtasks[];
}

export interface TaskWithSubtasks extends Task {
  subtasks: Subtask[];
  assignee?: User;
  deal: Deal;
}

export interface UserWithTeams extends User {
  userTeams: { team: Team }[];
}

export interface TeamWithMembers extends Team {
  userTeams: { user: User }[];
  deals: DealWithRelations[];
}

// API Request/Response types
export interface LoginRequest {
  email: string;
  password?: string; // Only for APP users
  authType: AuthType;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  authType: AuthType;
  password?: string; // Only for APP users
  isActive?: boolean;
  teamIds?: string[];
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

export interface CreateDealRequest {
  accountName: string;
  stakeholders: string[];
  renewalDate?: string;
  arr?: number;
  tam?: number;
  dealPriority: Priority;
  dealStage: DealStage;
  productsInUse: string[];
  growthOpportunities: string[];
  teamId?: string | null;
  createdBy?: string; // Will be set by the API
  salesDirectorId?: string; // Sales Director ID
  assignedTo?: string | null; // Assigned user ID
}

export interface UpdateDealRequest extends Partial<CreateDealRequest> {
  id: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  position: number;
  dealId: string;
  assigneeId?: string;
  status: TaskStatus;
  blockedReason?: string;
}

export interface UpdateTaskRequest extends Partial<CreateTaskRequest> {
  id: string;
  status?: TaskStatus;
  blockedReason?: string;
  expectedUnblockDate?: string;
}

export interface UpdateSubtaskRequest {
  id: string;
  title?: string;
  status?: SubtaskStatus;
  blockedReason?: string;
}

export interface BlockTaskRequest {
  taskId: string;
  reason: string;
  expectedUnblockDate?: string;
}

// Dashboard types
export interface DashboardMetrics {
  totalDeals: number;
  activeDeals: number;
  totalArr: number;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  openTasks: number;
  overdueTasks: number;
  recentActivity: ActivityLog[];
  deals: Deal[];
  teamPerformance?: TeamPerformance[];
}

export interface TeamPerformance {
  teamId: string;
  teamName: string;
  totalArr: number;
  dealCount: number;
  taskCount: number;
  completedTasks: number;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  dealName: string;
  assignee?: string;
  isOverdue: boolean;
}

// Kanban types
export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  tasks: TaskWithSubtasks[];
}

export interface DragResult {
  draggableId: string;
  destination: {
    droppableId: TaskStatus;
    index: number;
  } | null;
  source: {
    droppableId: TaskStatus;
    index: number;
  };
}

// Form types
export interface MultiStepFormData {
  step: number;
  totalSteps: number;
  data: Record<string, any>;
}

// UI Component types
export interface SelectOption {
  value: string;
  label: string;
}

export type PriorityColor = {
  [key in Priority]: string;
}

export type StatusColor = {
  [key in TaskStatus]: string;
}

// Constants
export const PRIORITY_COLORS: PriorityColor = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: StatusColor = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  BLOCKED: 'bg-red-100 text-red-800',
  DONE: 'bg-green-100 text-green-800',
};

export const DEAL_STAGE_COLORS: { [key in DealStage]: string } = {
  PROSPECTING: 'bg-gray-100 text-gray-800',
  DISCOVERY: 'bg-blue-100 text-blue-800',
  PROPOSAL: 'bg-yellow-100 text-yellow-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  RENEWAL: 'bg-purple-100 text-purple-800',
  CLOSED_WON: 'bg-green-100 text-green-800',
  CLOSED_LOST: 'bg-red-100 text-red-800',
};

// Utility types
export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Subtask request types
export interface CreateSubtaskRequest {
  title: string;
  taskId: string;
  position?: number;
  status?: SubtaskStatus;
  blockedReason?: string;
}

export interface UpdateSubtaskRequest {
  title?: string;
  status?: SubtaskStatus;
  blockedReason?: string;
}