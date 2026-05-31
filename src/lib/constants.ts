// ============================================================
// API 配置
// ============================================================
export const API_BASE = typeof window !== 'undefined' 
  ? (localStorage.getItem('api_base') || 'http://129.226.220.194:5000/api')
  : 'http://129.226.220.194:5000/api';

// ============================================================
// 项目状态配置
// ============================================================
export const PROJECT_STATUS_CONFIG = {
  planning: { 
    color: 'bg-blue-500', 
    label: '规划中',
    order: 2
  },
  in_progress: { 
    color: 'bg-yellow-500', 
    label: '进行中',
    order: 0
  },
  completed: { 
    color: 'bg-green-500', 
    label: '已完成',
    order: 1
  },
  on_hold: { 
    color: 'bg-orange-500', 
    label: '已暂停',
    order: 3
  },
  cancelled: { 
    color: 'bg-red-500', 
    label: '已终止',
    order: 4
  },
  overdue: {
    color: 'bg-red-600',
    label: '已超期',
    order: 5
  }
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUS_CONFIG;

// 状态顺序（用于列表排序和展示）
export const STATUS_ORDER: ProjectStatus[] = ['in_progress', 'completed', 'planning', 'on_hold', 'cancelled'];

// ============================================================
// 优先级配置
// ============================================================
export const PROJECT_PRIORITY_CONFIG = {
  1: { color: 'bg-red-500', label: '高' },
  2: { color: 'bg-orange-500', label: '中' },
  3: { color: 'bg-gray-500', label: '低' },
} as const;

export type ProjectPriority = 1 | 2 | 3;

// ============================================================
// 饼图颜色配置
// ============================================================
export const STATUS_PIE_COLORS = ['#3b82f6', '#eab308', '#22c55e', '#f97316', '#ef4444'];
export const PRIORITY_PIE_COLORS = ['#ef4444', '#eab308', '#22c55e'];

// ============================================================
// 项目操作日志配置
// ============================================================
export const PROJECT_ACTION_CONFIG = {
  created: { label: '创建', color: 'bg-green-500' },
  updated: { label: '更新', color: 'bg-blue-500' },
  deleted: { label: '删除', color: 'bg-red-500' },
  terminated: { label: '终止', color: 'bg-red-600' },
  paused: { label: '暂停', color: 'bg-orange-500' },
  resumed: { label: '恢复', color: 'bg-green-600' },
  progress_updated: { label: '进度更新', color: 'bg-purple-500' },
  status_changed: { label: '状态变更', color: 'bg-indigo-500' },
} as const;

export type ProjectAction = keyof typeof PROJECT_ACTION_CONFIG;

// ============================================================
// 字段名称映射
// ============================================================
export const PROJECT_FIELD_LABELS: Record<string, string> = {
  name: '任务名称',
  description: '任务目标',
  manager_id: '负责人',
  end_date: '预期完成日期',
  progress: '任务进度',
  priority: '优先级',
  status: '状态',
  current_progress: '任务进展详情',
  department_id: '部门',
  module_id: '模块',
  project_type_id: '项目类型',
  budget: '预算',
  start_date: '开始日期'
};

// ============================================================
// 项目类型配置
// ============================================================
export const PROJECT_TYPE_COLORS = [
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-amber-500'
];

// ============================================================
// 表格列宽配置（百分比）
// ============================================================
export const DEFAULT_COLUMN_WIDTHS = {
  name: 16,
  type: 8,
  module: 10,
  priority: 8,
  manager: 18,
  endDate: 10,
  progress: 12,
  status: 8,
  action: 10
};

// ============================================================
// 分页配置
// ============================================================
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50];
export const DEFAULT_PAGE_SIZE = 10;

// ============================================================
// 状态变更映射（中文）
// ============================================================
export const STATUS_DISPLAY_MAP: Record<string, string> = {
  planning: '规划中',
  in_progress: '进行中',
  completed: '已完成',
  on_hold: '暂停',
  cancelled: '已取消'
};