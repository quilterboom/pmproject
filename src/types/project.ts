// 项目基础信息
export interface Project {
  id: number;
  name: string;
  description?: string;
  department_id?: number;
  office_id?: number;
  module_id?: number;
  project_type_id?: number;
  progress: number;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  priority: '1' | '2' | '3';
  budget?: number;
  start_date?: string;
  end_date?: string;
  manager_name?: string;
  manager_phone?: string;
  created_at?: string;
  updated_at?: string;
  goal?: string;
  current_progress?: string;
}

// 项目状态类型
export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled' | 'overdue';

// 优先级类型
export type ProjectPriority = '1' | '2' | '3';

// 项目详情（包含关联信息）
export interface ProjectDetail extends Project {
  department_name?: string;
  office_name?: string;
  module_name?: string;
  project_type_name?: string;
  milestones?: Milestone[];
  tasks?: Task[];
}

// 里程碑
export interface Milestone {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  due_date?: string;
  completed: boolean | number;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// 任务（子任务）
export interface Task {
  id: number;
  project_id: number;
  milestone_id?: number;
  title: string;
  description?: string;
  assignee?: string;
  status: ProjectStatus;
  priority: string;
  due_date?: string;
  completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

// 项目筛选条件
export interface ProjectFilter {
  status?: ProjectStatus;
  priority?: ProjectPriority;
  module_id?: number;
  project_type_id?: string;
  keyword?: string;
  manager_name?: string;
  end_date_from?: string;
  end_date_to?: string;
  status_ne?: ProjectStatus;
  page: number;
  pageSize: number;
}

// 项目列表响应
export interface ProjectListResponse {
  list: ProjectDetail[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 统计数据
export interface ProjectStats {
  totalProjects: number;
  avgProgress: number;
  overview: {
    recentProjects: number;
    upcomingProjects: number;
    overdueProjects: number;
  };
  byStatus: Array<{ status: ProjectStatus; count: number }>;
  byPriority: Array<{ priority: string; count: number }>;
  projectsByStatus: Array<{
    status: ProjectStatus;
    count: number;
    projects: Array<{
      id: number;
      name: string;
      department_name?: string;
      progress: number;
      priority: string;
      end_date?: string;
      is_overdue?: boolean;
    }>;
  }>;
  latestProjects: Project[];
}

// 创建项目请求
export interface CreateProjectRequest {
  name: string;
  description?: string;
  departmentId?: number;
  officeId?: number;
  moduleId?: number;
  projectTypeId?: number;
  priority?: ProjectPriority;
  budget?: number;
  startDate?: string;
  endDate?: string;
  managerName?: string;
  managerPhone?: string;
  status?: ProjectStatus;
  progress?: number;
}

// 更新项目请求
export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: number;
}

// 操作日志
export interface ProjectLog {
  id: number;
  project_id: number;
  operator_id: number;
  operator_name?: string;
  action: string;
  details: string;
  created_at: string;
}