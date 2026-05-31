'use client';

// ============================================================
// 区域一：导入依赖
// ============================================================
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  FilterBar, 
  Pagination, 
  ProjectCard,
  ProjectFormDialog,
  LogsDialog,
  TeamDialog,
  ConfirmDialog,
  ProjectHeader
} from '@/components/projects';
import { useProjectStore } from '@/stores';

// ============================================================
// 区域二：状态定义（使用 zustand 管理）
// ============================================================
export default function ProjectsPage() {
  const router = useRouter();
  
  // 使用 zustand store 管理筛选、分页、项目类型、模块等状态
  const { 
    projectTypes,
    modules,
    setProjectTypes, 
    setModules, 
    setUsers,
    users,
    filters,
    pagination,
    projectCounts,
    projectsByType,
    typeLoading,
    setPagination,
    setProjectCounts,
    setProjectsByType,
    setTypeLoading,
    setFilter,
    resetFilters
  } = useProjectStore();
  
  const [loading, setLoading] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [managerFilter, setManagerFilter] = useState('');

  // 根据搜索筛选用户列表
  const filteredUsers = filters.filterManager
    ? users.filter(u =>
        (u.real_name || u.username || '').toLowerCase().includes(filters.filterManager.toLowerCase())
      )
    : users.filter(u => u.username !== 'admin');

  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [projectLogs, setProjectLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [terminateReason, setTerminateReason] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  // 视图模式：list=列表, card=卡片, gantt=甘特图
  const [viewMode, setViewMode] = useState<'list' | 'card' | 'gantt'>('card');
  // 团队成员相关
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [selectedProjectForTeam, setSelectedProjectForTeam] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({ userId: '', role: 'member' });
  const [formData, setFormData] = useState({
    name: '',
    goal: '',
    managerIds: [] as string[],
    priority: 2,
    endDate: '',
    progress: 0,
    currentProgress: '',
    projectTypeId: 'none',
    moduleId: 'none'
  });
  // AI 智能创建相关
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  // AI 问答相关
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<{role: string, content: string}[]>([]);
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);
  // 催办相关
  const [urgingProjectId, setUrgingProjectId] = useState<number | null>(null);
  
  // 可拖动列宽相关
  const [columnWidths, setColumnWidths] = useState({
    name: 16,
    type: 8,
    module: 10,
    priority: 8,
    manager: 18,
    endDate: 10,
    progress: 12,
    status: 8,
    action: 10
  });
  const [resizing, setResizing] = useState<string | null>(null);
  const [resizingStartX, setResizingStartX] = useState(0);
  const [resizingStartWidth, setResizingStartWidth] = useState(0);
  
  // 拖动开始
  const handleResizeStart = (columnKey: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(columnKey);
    setResizingStartX(e.clientX);
    setResizingStartWidth(columnWidths[columnKey as keyof typeof columnWidths] || 10);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - resizingStartX;
      const containerWidth = document.querySelector('.task-list-container')?.clientWidth || window.innerWidth;
      const deltaPercent = (delta / containerWidth) * 100;
      const newWidth = Math.max(5, Math.min(50, resizingStartWidth + deltaPercent));
      
      setColumnWidths(prev => ({
        ...prev,
        [columnKey]: newWidth
      }));
    };
    
    const handleMouseUp = () => {
      setResizing(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // ============================================================
  // 区域三：API 请求函数
  // ============================================================
  // 按类型获取任务数据（后端分页）
  const fetchProjectsByType = async (typeId: string, page: number = 1, pageSize: number = 10) => {
    try {
      setTypeLoading(typeId, true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      
      // 添加当前筛选条件
      const currentFilters = filterRef.current;
      if (currentFilters.searchKeyword) params.append('keyword', currentFilters.searchKeyword);
      if (currentFilters.filterStatus && currentFilters.filterStatus !== 'all') params.append('status', currentFilters.filterStatus);
      if (currentFilters.filterManager && currentFilters.filterManager !== 'all') params.append('manager_name', currentFilters.filterManager);
      if (currentFilters.filterPriority && currentFilters.filterPriority !== 'all') params.append('priority', currentFilters.filterPriority);
      if (currentFilters.filterProjectType && currentFilters.filterProjectType !== 'all') params.append('project_type_id', currentFilters.filterProjectType);
      if (currentFilters.filterModule && currentFilters.filterModule !== 'all') params.append('module_id', currentFilters.filterModule);
      
      // 按类型筛选
      if (typeId !== 'all' && typeId !== 'untyped') {
        params.append('project_type_id', typeId);
      }
      
      const response = await fetch(`/api/projects?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        const newData = result.data.list;
        
        setProjectsByType(typeId, newData);
        setProjectCounts(typeId, result.data.pagination?.total || result.data.list.length);
        setTypeLoading(typeId, false);
      }
    } catch (err) {
      console.error('获取任务列表失败:', err);
      setTypeLoading(typeId, false);
    }
  };

  useEffect(() => {
    // 获取用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAdmin(parsedUser.role === 'admin');
    }
    
    // 不调用 fetchProjects，改为按类型分别请求
    fetchUsers();
    fetchProjectTypes();
    fetchModules();
  }, []);

  // 当 projectTypes 加载完成后，按类型分别请求数据
  useEffect(() => {
    if (projectTypes.length > 0) {
      // 为每个任务类型发送请求
      projectTypes.forEach(type => {
        fetchProjectsByType(type.id.toString(), 1, 10);
      });
      setInitialLoadComplete(true);
      // 延迟设置 loading 为 false，等待所有数据加载完成
      setTimeout(() => setLoading(false), 1000);
    }
  }, [projectTypes]);

  // 使用 ref 存储最新的筛选值，避免闭包问题
  const filterRef = useRef(filters);

  // 更新 ref 当状态变化时
  useEffect(() => {
    filterRef.current = filters;
  }, [filters]);
  
  // 当筛选条件变化时，重新加载数据
  useEffect(() => {
    if (initialLoadComplete && projectTypes.length > 0) {
      // 为每个任务类型发送请求
      projectTypes.forEach(type => {
        fetchProjectsByType(type.id.toString(), 1, pagination[type.id.toString()]?.pageSize || 10);
      });
    }
  }, [filters]);

  // 重新加载所有类型的数据
  const fetchProjects = useCallback(async () => {
    try {
      // 清空现有数据，重新按类型加载
      // 注意：zustand 的 setProjectsByType 需要逐个设置
      Object.keys(projectsByType).forEach(typeId => {
        setProjectsByType(typeId, []);
      });
      
      // 为每个任务类型发送请求
      projectTypes.forEach(type => {
        fetchProjectsByType(type.id.toString(), pagination[type.id.toString()]?.page || 1, pagination[type.id.toString()]?.pageSize || 10);
      });
    } catch (err) {
      console.error('获取任务列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [projectTypes, pagination, projectsByType]);

  // ============================================================
  // 区域四：数据处理函数
  // ============================================================
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setUsers(result.data.list.filter((u: any) => u.username !== 'admin'));
      }
    } catch (err) {
      console.error('加载用户列表失败:', err);
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/project-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setProjectTypes(result.data);
      }
    } catch (err) {
      console.error('加载任务类型失败:', err);
    }
  };

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/modules', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setModules(result.data);
      }
    } catch (err) {
      console.error('加载模块列表失败:', err);
    }
  };

  // 团队成员相关函数
  const openTeamDialog = async (project: any) => {
    setSelectedProjectForTeam(project);
    setTeamDialogOpen(true);
    setTeamLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/project-members?project_id=${project.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setTeamMembers(result.data || []);
      }
    } catch (err) {
      console.error('获取团队成员失败:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.userId || !selectedProjectForTeam) return;
    setAddingMember(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/project-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          projectId: selectedProjectForTeam.id,
          userId: parseInt(newMember.userId),
          role: newMember.role
        })
      });
      setNewMember({ userId: '', role: 'member' });
      openTeamDialog(selectedProjectForTeam);
    } catch (err) {
      alert('添加成员失败');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (id: number) => {
    if (!confirm('确定移除此成员？')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/project-members?id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    openTeamDialog(selectedProjectForTeam);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: name === 'progress' ? parseInt(value, 10) : value
    });
  };

  const handleManagerToggle = (userId: string) => {
    setFormData((prev: any) => {
      const currentManagers = prev.managerIds || [];
      if (currentManagers.includes(userId)) {
        return {
          ...prev,
          managerIds: currentManagers.filter((id: string) => id !== userId)
        };
      } else {
        return {
          ...prev,
          managerIds: [...currentManagers, userId]
        };
      }
    });
  };

  const handleDeleteProject = async (projectId: number) => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        fetchProjects();
      } else {
        alert(result.message || '删除任务失败');
      }
    } catch (err) {
      alert('删除任务失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleTerminateProject = async () => {
    if (!terminateReason.trim()) {
      alert('请输入终止原因');
      return;
    }
    setTerminating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${selectedProject.id}/terminate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: terminateReason })
      });
      const result = await response.json();
      if (result.success) {
        setTerminateDialogOpen(false);
        setTerminateReason('');
        setSelectedProject(null);
        fetchProjects();
      } else {
        alert(result.message || '终止任务失败');
      }
    } catch (err) {
      alert('终止任务失败');
    } finally {
      setTerminating(false);
    }
  };

  const handlePauseProject = async () => {
    if (!pauseReason.trim()) {
      alert('请输入暂停原因');
      return;
    }
    setPausing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${selectedProject.id}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason: pauseReason })
      });
      const result = await response.json();
      if (result.success) {
        setPauseDialogOpen(false);
        setPauseReason('');
        setSelectedProject(null);
        fetchProjects();
      } else {
        alert(result.message || '暂停任务失败');
      }
    } catch (err) {
      alert('暂停任务失败');
    } finally {
      setPausing(false);
    }
  };

  // AI 智能创建：解析任务描述
  const handleAiParse = async () => {
    if (!aiDescription.trim()) return;
    
    setAiLoading(true);
    setAiResult(null);
    try {
      const response = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          description: aiDescription
        })
      });
      const result = await response.json();
      if (result.success) {
        setAiResult(result.data);
      } else {
        alert(result.message || 'AI 解析失败: ' + (result.error || ''));
      }
    } catch (err) {
      console.error('AI 解析失败:', err);
      alert('AI 解析失败，请重试');
    } finally {
      setAiLoading(false);
    }
  };

  // 应用 AI 结果到表单
  const applyAiResult = () => {
    if (!aiResult) return;
    setFormData((prev: any) => ({
      ...prev,
      name: aiResult.name || prev.name,
      goal: aiResult.description || prev.goal,
      priority: aiResult.priority || prev.priority,
      endDate: aiResult.endDate || prev.endDate
    }));
    setAiDescription('');
    setAiResult(null);
  };

  // AI 问答发送
  const handleAiChatSend = async () => {
    if (!aiChatInput.trim() || aiChatLoading) return;

    const userMsg = aiChatInput.trim();
    setAiChatInput('');
    setAiChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiChatLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();

      if (data.success) {
        setAiChatMessages(prev => [...prev, { role: 'assistant', content: data.data.content }]);
      } else {
        setAiChatMessages(prev => [...prev, { role: 'assistant', content: `错误: ${data.message}` }]);
      }
    } catch (error: any) {
      setAiChatMessages(prev => [...prev, { role: 'assistant', content: `请求失败: ${error.message}` }]);
    } finally {
      setAiChatLoading(false);
      setTimeout(() => aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');

      // 将前端表单字段转换为 API 期望的字段格式
      let managerName = '';
      let managerPhone = '';
      
      // 如果选择了负责人，获取所有负责人的姓名（用逗号分隔）
      if (formData.managerIds && formData.managerIds.length > 0) {
        const managerNames: string[] = [];
        const managerPhones: string[] = [];
        formData.managerIds.forEach((managerId: string) => {
          const manager = users.find(u => u.id.toString() === managerId.toString());
          if (manager) {
            managerNames.push(manager.real_name || manager.username || '');
            if (manager.phone) managerPhones.push(manager.phone);
          }
        });
        managerName = managerNames.join(', ');
        managerPhone = managerPhones.join(', ');
      }

      // 构建 API 期望的数据格式
      const submitData = {
        name: formData.name,
        description: formData.goal || '',  // goal 对应 description
        priority: formData.priority,
        endDate: formData.endDate || null,
        progress: formData.progress || 0,
        managerName: managerName,  // 转换 managerIds 为 managerName
        managerPhone: managerPhone,
        projectTypeId: formData.projectTypeId === 'none' ? null : formData.projectTypeId,
        moduleId: formData.moduleId === 'none' ? null : parseInt(formData.moduleId),
      };

      if (editingProject) {
        // 编辑模式
        const response = await fetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(submitData)
        });
        const result = await response.json();
        if (result.success) {
          setDialogOpen(false);
          resetForm();
          fetchProjects();
        } else {
          alert(result.message || '更新任务失败');
        }
      } else {
        // 新建模式
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(submitData)
        });
        const result = await response.json();
        if (result.success) {
          setDialogOpen(false);
          resetForm();
          fetchProjects();
        } else {
          alert(result.message || '创建任务失败');
        }
      }
    } catch (err) {
      alert(editingProject ? '更新任务失败' : '创建任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      goal: '',
      managerIds: [],
      priority: 2,
      endDate: '',
      progress: 0,
      currentProgress: '',
      projectTypeId: 'none',
      moduleId: 'none'
    });
  };

  const openNewProjectDialog = () => {
    resetForm();
    setEditingProject(null);
    setAiDescription('');
    setAiResult(null);
    setDialogOpen(true);
  };

  // 辅助函数：将 UTC 日期字符串转换为本地日期字符串（YYYY-MM-DD）
  const toLocalDateString = (utcDateStr: string | null): string => {
    if (!utcDateStr) return '';
    const date = new Date(utcDateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const openEditDialog = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      goal: project.description || '',
      managerIds: project.manager_ids ? project.manager_ids.split(',') : [],
      priority: project.priority || 2,
      endDate: toLocalDateString(project.end_date),
      progress: project.progress || 0,
      currentProgress: project.current_progress || '',
      projectTypeId: project.project_type_id ? project.project_type_id.toString() : 'none',
      moduleId: project.module_id ? project.module_id.toString() : 'none'
    });
    setDialogOpen(true);
  };

  const fetchProjectLogs = async (projectId: number) => {
    try {
      setLogsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/project-logs?project_id=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setProjectLogs(result.data || []);
        setLogsDialogOpen(true);
      } else {
        alert('获取操作记录失败');
      }
    } catch (err) {
      console.error('获取操作记录失败:', err);
      alert('获取操作记录失败');
    } finally {
      setLogsLoading(false);
    }
  };

  const openTerminateDialog = (project: any) => {
    setSelectedProject(project);
    setTerminateReason('');
    setTerminateDialogOpen(true);
  };

  const openPauseDialog = (project: any) => {
    setSelectedProject(project);
    setPauseReason('');
    setPauseDialogOpen(true);
  };

  // 催办功能
  const handleUrge = async (projectId: number) => {
    setUrgingProjectId(projectId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/urge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ projectId })
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message || '催办成功');
      } else {
        alert(result.message || '催办失败');
      }
    } catch (err) {
      alert('催办失败');
    } finally {
      setUrgingProjectId(null);
    }
  };

  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
    on_hold: 'bg-orange-500',
    cancelled: 'bg-red-500',
    overdue: 'bg-red-600',
  };

  // ============================================================
  // 区域五：业务逻辑函数
  // ============================================================
  const statusLabels: Record<string, string> = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    on_hold: '已暂停',
    cancelled: '已终止',
    overdue: '已超期',
  };

  // 根据进度计算状态
  const getStatusByProgress = (progress: string | number): string => {
    const progressNum = typeof progress === 'string' ? parseFloat(progress) : progress;
    if (progressNum === 0) return 'planning';
    if (progressNum === 100) return 'completed';
    return 'in_progress';
  };

  // 获取任务状态（优先使用 status 字段，否则根据进度计算）
  const getProjectStatus = (project: any): string => {
    // 如果任务有特殊状态（暂停、终止），直接使用
    if (project.status === 'on_hold' || project.status === 'cancelled') {
      return project.status;
    }
    // 如果已完成，不判断超期
    if (project.status === 'completed' || project.progress == 100) {
      return 'completed';
    }
    // 判断是否超期
    if (project.end_date && new Date() > new Date(project.end_date)) {
      return 'overdue';
    }
    // 否则根据进度计算
    return getStatusByProgress(project.progress);
  };

  const priorityColors: Record<number, string> = {
    1: 'bg-red-500',
    2: 'bg-orange-500',
    3: 'bg-gray-500',
  };

  const priorityLabels: Record<number, string> = {
    1: '高',
    2: '中',
    3: '低',
  };

  // 字段名称映射（中文）
  const fieldLabels: Record<string, string> = {
    name: '任务名称',
    description: '任务目标',
    manager_id: '负责人',
    end_date: '预期完成日期',
    progress: '任务进度',
    priority: '优先级',
    status: '状态',
    current_progress: '任务进展详情'
  };

  // 操作类型映射（中文）
  const actionLabels: Record<string, string> = {
    created: '创建',
    updated: '更新',
    deleted: '删除',
    terminated: '终止',
    paused: '暂停'
  };

  const actionColors: Record<string, string> = {
    created: 'bg-green-500',
    updated: 'bg-blue-500',
    deleted: 'bg-red-500',
    terminated: 'bg-red-600',
    paused: 'bg-orange-500'
  };

  // 格式化变更值
  const formatChangeValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return '-';
    if (key === 'progress') return `${value}%`;
    if (key === 'priority') return `${value} - ${priorityLabels[value] || value}`;
    if (key === 'status') {
      const statusMap: Record<string, string> = {
        planning: '规划中',
        in_progress: '进行中',
        completed: '已完成',
        on_hold: '暂停',
        cancelled: '已取消'
      };
      return statusMap[value] || value;
    }
    if (key === 'end_date' && value) return new Date(value).toLocaleDateString('zh-CN');
    return String(value);
  };

  // ============================================================
  // 区域六：渲染函数
  // ============================================================
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================
  // 区域六-A：主渲染区域
  // ============================================================
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        </div>
        <div className="flex gap-2">
          {/* 筛选栏 */}
          <FilterBar />

          <ProjectFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            editingProject={editingProject}
            formData={formData}
            setFormData={setFormData}
            managerFilter={managerFilter}
            setManagerFilter={setManagerFilter}
            onSubmit={handleSubmit}
            submitting={submitting}
            onAiParse={handleAiParse}
            aiDescription={aiDescription}
            setAiDescription={setAiDescription}
            aiLoading={aiLoading}
            aiResult={aiResult}
            onApplyAiResult={applyAiResult}
          />
        </div>
      </div>

      {/* 按任务类型分组的视图 */}
      <div className="space-y-6">
        {/* 按任务类型分组数据 */}
        {(() => {
          // 排序状态优先级
          const statusPriority: Record<string, number> = {
            'overdue': 1,
            'in_progress': 2,
            'planning': 3,
            'on_hold': 4,
            'completed': 5,
            'cancelled': 6
          };
          
          // 按状态排序函数
          const sortByStatus = (projects: any[]) => {
            return [...projects].sort((a, b) => {
              const statusA = statusPriority[getProjectStatus(a)] || 99;
              const statusB = statusPriority[getProjectStatus(b)] || 99;
              return statusA - statusB;
            });
          };
          
          // 分页处理 - 后端分页模式下直接返回所有数据（API已经返回了当前页的数据）
          const getPaginatedProjects = (typeId: string, projects: any[]) => {
            // 后端分页模式：API已经返回了当前页的数据，不再做前端分页切片
            return sortByStatus(projects);
          };

          const handlePageChange = (typeId: string, page: number, pageSize: number) => {
            setPagination(typeId, { page, pageSize });
            // 触发后端分页请求
            fetchProjectsByType(typeId, page, pageSize);
          };
          
          return (
            <>
              {/* 有任务类型的分组 */}
              {projectTypes.map(type => {
                const typeProjects = projectsByType[type.id.toString()] || [];
                if (typeProjects.length === 0) return null;
                const pageConfig = pagination[type.id.toString()] || { page: 1, pageSize: 10 };
                
                return (
                  <Card key={type.id} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-white">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        <CardTitle className="text-lg">{type.name}</CardTitle>
                        <Badge variant="secondary">{projectCounts[type.id.toString()] || 0} 个任务</Badge>
                      </div>
                    </CardHeader>
                    {/* 表头 */}
                    <ProjectHeader 
                      columnWidths={columnWidths}
                      resizing={resizing}
                      onResizeStart={handleResizeStart}
                    />
                    {/* 数据列表 */}
                    <div className="space-y-1 bg-white">
                      {getPaginatedProjects(type.id.toString(), typeProjects).map(project => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          columnWidths={columnWidths}
                          getProjectStatus={getProjectStatus}
                          statusColors={statusColors}
                          statusLabels={statusLabels}
                          toLocalDateString={toLocalDateString}
                          isAdmin={isAdmin}
                          urgingProjectId={urgingProjectId}
                          onUrge={handleUrge}
                        />
                      ))}
                      {getPaginatedProjects(type.id.toString(), typeProjects).length === 0 && (
                        <div className="py-8 text-center text-muted-foreground text-sm">该类型暂无任务</div>
                      )}
                    </div>
                    {/* 分页 */}
                    {(projectCounts[type.id.toString()] || 0) > 0 && (
                      <Pagination 
                        typeId={type.id.toString()}
                        onPageChange={(page, pageSize) => handlePageChange(type.id.toString(), page, pageSize)}
                      />
                    )}
                  </Card>
                );
              })}
              
              {/* 没有任何任务时显示提示 */}
              {Object.keys(projectsByType).length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    暂无任务
                  </CardContent>
                </Card>
              )}
            </>
          );
        })()}
      </div>

      {/* 操作记录对话框 */}
      <LogsDialog
        open={logsDialogOpen}
        onOpenChange={setLogsDialogOpen}
        logs={projectLogs}
        loading={logsLoading}
        actionLabels={actionLabels}
        actionColors={actionColors}
      />

      {/* 团队成员对话框 */}
      <TeamDialog
        open={teamDialogOpen}
        onOpenChange={setTeamDialogOpen}
        project={selectedProjectForTeam}
        members={teamMembers}
        loading={teamLoading}
        newMember={newMember}
        onNewMemberChange={setNewMember}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        adding={addingMember}
        isAdmin={isAdmin}
      />

      {/* 终止任务对话框 */}
      <ConfirmDialog
        type="terminate"
        open={terminateDialogOpen}
        onOpenChange={(open) => {
          setTerminateDialogOpen(open);
          if (!open) {
            setTerminateReason('');
            setSelectedProject(null);
          }
        }}
        project={selectedProject}
        reason={terminateReason}
        onReasonChange={setTerminateReason}
        onConfirm={handleTerminateProject}
        loading={terminating}
      />

      {/* 暂停任务对话框 */}
      <ConfirmDialog
        type="pause"
        open={pauseDialogOpen}
        onOpenChange={(open) => {
          setPauseDialogOpen(open);
          if (!open) {
            setPauseReason('');
            setSelectedProject(null);
          }
        }}
        project={selectedProject}
        reason={pauseReason}
        onReasonChange={setPauseReason}
        onConfirm={handlePauseProject}
        loading={pausing}
      />
      <FloatingChat />
    </div>
  );
}

function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<{role: string, content: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  // 美化AI回复为易读的纯文本
  const formatMessage = (content: string) => {
    const parts: React.ReactNode[] = [];
    let key = 0;

    // 先处理markdown表格为简化展示
    if (content.includes('|') && content.includes('---')) {
      const lines = content.split('\n').filter(l => l.trim());
      content = lines.map(l => {
        if (l.match(/^\|.+\|$/)) return l.replace(/\|/g, '  ').trim();
        return l;
      }).join('\n');
    }

    // 分段处理
    content.split('\n').forEach(line => {
      if (line.startsWith('### ')) {
        parts.push(<h4 key={key++} className="font-bold text-sm mt-2 mb-1 text-purple-700">{line.slice(4)}</h4>);
      } else if (line.startsWith('## ')) {
        parts.push(<h3 key={key++} className="font-bold text-base mt-3 mb-1">{line.slice(3)}</h3>);
      } else if (line.startsWith('- ')) {
        parts.push(<li key={key++} className="ml-2 text-gray-600">• {line.slice(2)}</li>);
      } else if (line.match(/^\d+\./)) {
        parts.push(<div key={key++} className="ml-2 text-gray-600">{line}</div>);
      } else if (line) {
        // 加粗
        const boldParts = line.split(/(\*\*.*?\*\*)/g);
        parts.push(
          <div key={key++} className="text-gray-700">
            {boldParts.map((p, i) => 
              p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : p
            )}
          </div>
        );
      }
    });

    return <>{parts}</>;
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    setMsgs(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input }) });
      const dt = await res.json();
      const reply = dt.data?.content || dt.reply || '无回复';
      setMsgs(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch { setMsgs(prev => [...prev, { role: 'assistant', content: '请求失败' }]); }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && <div className="absolute bottom-14 right-0 w-80 bg-white rounded-lg shadow-xl border mb-2 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 flex justify-between"><span className="text-white font-medium text-sm">AI</span><button onClick={() => setOpen(false)} className="text-white/80">✕</button></div>
        <div className="h-56 overflow-y-auto p-2 bg-gray-50 text-xs">{msgs.map((m, i) => <div key={i} className={`p-1.5 rounded mb-1 ${m.role === 'user' ? 'bg-blue-500 text-white ml-4' : 'bg-white border mr-4'}`}>{m.role === 'assistant' ? formatMessage(m.content) : m.content}</div>)}{loading && <div className="p-1.5 rounded bg-gray-200">...</div>}<div ref={endRef} /></div>
        <div className="p-2 border-t flex gap-1"><input className="flex-1 h-8 text-sm border rounded px-2" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} /><button className="h-8 px-3 bg-blue-600 text-white rounded" onClick={send}>→</button></div>
      </div>}
      <button onClick={() => setOpen(true)} className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg text-white font-bold">AI</button>
    </div>
  );

  // ============================================================
  // 区域六-B：对话框和悬浮组件
  // ============================================================
}
