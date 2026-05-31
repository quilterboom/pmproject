import { PROJECT_STATUS_CONFIG, PROJECT_PRIORITY_CONFIG, STATUS_DISPLAY_MAP } from './constants';

// ============================================================
// 项目状态工具函数
// ============================================================

export interface Project {
  id: number;
  name: string;
  status: string;
  progress: number;
  end_date?: string;
  [key: string]: any;
}

/**
 * 根据项目数据获取计算后的状态
 * 包含动态计算逻辑（overdue 等）
 */
export function getProjectStatus(project: Project): string {
  if (project.status === 'on_hold' || project.status === 'cancelled') {
    return project.status;
  }
  if (project.status === 'completed' || project.progress == 100) {
    return 'completed';
  }
  if (project.end_date && new Date() > new Date(project.end_date)) {
    return 'overdue';
  }
  return getStatusByProgress(project.progress);
}

/**
 * 根据进度获取状态
 */
export function getStatusByProgress(progress: number): string {
  if (progress === 0) return 'planning';
  if (progress >= 100) return 'completed';
  return 'in_progress';
}

/**
 * 获取状态标签（中文）
 */
export function getStatusLabel(status: string): string {
  return PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG]?.label 
    || STATUS_DISPLAY_MAP[status] 
    || status;
}

/**
 * 获取状态颜色
 */
export function getStatusColor(status: string): string {
  return PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG]?.color 
    || 'bg-gray-500';
}

// ============================================================
// 优先级工具函数
// ============================================================

/**
 * 获取优先级标签（中文）
 */
export function getPriorityLabel(priority: string | number): string {
  const key = String(priority) as '1' | '2' | '3';
  return PROJECT_PRIORITY_CONFIG[key]?.label || String(priority);
}

/**
 * 获取优先级颜色
 */
export function getPriorityColor(priority: string | number): string {
  const key = String(priority) as '1' | '2' | '3';
  return PROJECT_PRIORITY_CONFIG[key]?.color || 'bg-gray-500';
}

// ============================================================
// 格式化工具函数
// ============================================================

/**
 * 格式化日期
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN');
  } catch {
    return dateStr;
  }
}

/**
 * 格式化变更值
 */
export function formatChangeValue(key: string, value: any): string {
  if (value === null || value === undefined) return '-';
  
  if (key === 'progress') return `${value}%`;
  if (key === 'priority') return `${value} - ${getPriorityLabel(value)}`;
  if (key === 'status') return getStatusLabel(value);
  if (key === 'end_date' || key === 'start_date') return formatDate(value);
  
  return String(value);
}

/**
 * 格式化进度条百分比
 */
export function formatProgress(progress: number | null | undefined): string {
  return `${progress || 0}%`;
}

// ============================================================
// 筛选工具函数
// ============================================================

/**
 * 判断项目是否超期
 */
export function isProjectOverdue(project: Project): boolean {
  if (!project.end_date) return false;
  const status = getProjectStatus(project);
  if (status === 'completed' || status === 'on_hold' || status === 'cancelled') {
    return false;
  }
  return new Date() > new Date(project.end_date);
}

/**
 * 判断项目是否即将到期（30天内）
 */
export function isProjectUpcoming(project: Project, days = 30): boolean {
  if (!project.end_date) return false;
  const status = getProjectStatus(project);
  if (status === 'completed' || status === 'cancelled') {
    return false;
  }
  const endDate = new Date(project.end_date);
  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return endDate >= now && endDate <= thirtyDaysLater;
}

// ============================================================
// 排序工具函数
// ============================================================

/**
 * 状态优先级排序
 */
export function getStatusSortOrder(status: string): number {
  return PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG]?.order ?? 99;
}

/**
 * 按状态排序项目列表
 */
export function sortProjectsByStatus<T extends Project>(projects: T[]): T[] {
  return [...projects].sort((a, b) => {
    return getStatusSortOrder(getProjectStatus(a)) - getStatusSortOrder(getProjectStatus(b));
  });
}

// ============================================================
// 搜索工具函数
// ============================================================

/**
 * 项目搜索匹配
 */
export function matchProjectSearch(project: Project, keyword: string): boolean {
  if (!keyword) return true;
  const lowerKeyword = keyword.toLowerCase();
  return (
    project.name?.toLowerCase().includes(lowerKeyword) ||
    project.description?.toLowerCase().includes(lowerKeyword) ||
    String(project.id).includes(keyword)
  );
}