'use client';

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

export default function ProjectsPage() {
  const router = useRouter();
  // 不再使用 projects state，数据存储在 projectsByType 中
  const [loading, setLoading] = useState(true);
// 标记初始加载是否完成
const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [managerFilter, setManagerFilter] = useState('');

  // 根据搜索筛选用户列表
  const filteredUsers = managerFilter
    ? users.filter(u => 
        (u.real_name || u.username || '').toLowerCase().includes(managerFilter.toLowerCase())
      )
    : users;

  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [projectLogs, setProjectLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterManager, setFilterManager] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProjectType, setFilterProjectType] = useState('all');
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [terminateReason, setTerminateReason] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [terminating, setTerminating] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
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
    projectTypeId: 'none'
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
  
  // 分页相关状态（后端分页）
  const [pagination, setPagination] = useState<Record<string, { page: number; pageSize: number }>>({});
  // 记录每个类型的总数（用于后端分页）
  const [projectCounts, setProjectCounts] = useState<Record<string, number>>({});
  // 按类型存储项目数据（后端分页模式）
  const [projectsByType, setProjectsByType] = useState<Record<string, any[]>>({});
  // 记录加载状态
  const [typeLoading, setTypeLoading] = useState<Record<string, boolean>>({});

  // 按类型获取项目数据（后端分页）
  const fetchProjectsByType = async (typeId: string, page: number = 1, pageSize: number = 10) => {
    try {
      setTypeLoading(prev => ({ ...prev, [typeId]: true }));
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('page_size', pageSize.toString());
      
      // 添加当前筛选条件
      const filters = filterRef.current;
      if (filters.searchKeyword) params.append('keyword', filters.searchKeyword);
      if (filters.filterStatus && filters.filterStatus !== 'all') params.append('status', filters.filterStatus);
      if (filters.filterManager && filters.filterManager !== 'all') params.append('manager_name', filters.filterManager);
      if (filters.filterPriority && filters.filterPriority !== 'all') params.append('priority', filters.filterPriority);
      if (filters.filterProjectType && filters.filterProjectType !== 'all') params.append('project_type_id', filters.filterProjectType);
      
      // 按类型筛选
      if (typeId !== 'all') {
        params.append('project_type_id', typeId);
      }
      
      const response = await fetch(`/api/projects?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        // 如果是第二页及以后，合并数据；如果是第一页，直接替换
        const existingData = pagination[typeId]?.page === 1 ? [] : (projectsByType[typeId] || []);
        const newData = result.data.list;
        
        setProjectsByType(prev => ({
          ...prev,
          [typeId]: newData
        }));
        setProjectCounts(prev => ({
          ...prev,
          [typeId]: result.data.pagination?.total || result.data.list.length
        }));
        // 加载完成后重置加载状态
        setTypeLoading(prev => ({ ...prev, [typeId]: false }));
      }
    } catch (err) {
      console.error('获取项目列表失败:', err);
      setTypeLoading(prev => ({ ...prev, [typeId]: false }));
    }
    // 不要在这里设置 setLoading(false)，由初始加载逻辑统一处理
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
  }, []);

  // 当 projectTypes 加载完成后，按类型分别请求数据
  useEffect(() => {
    if (projectTypes.length > 0) {
      // 为每个任务类型发送请求
      projectTypes.forEach(type => {
        fetchProjectsByType(type.id.toString(), 1, 10);
      });
      // 同时请求未分类的项目
      fetchProjectsByType('untyped', 1, 10);
      setInitialLoadComplete(true);
      // 延迟设置 loading 为 false，等待所有数据加载完成
      setTimeout(() => setLoading(false), 1000);
    }
  }, [projectTypes]);

  // 使用 ref 存储最新的筛选值，避免闭包问题
  const filterRef = useRef({
    searchKeyword: '',
    filterStatus: 'all',
    filterManager: 'all',
    filterPriority: 'all',
    filterProjectType: 'all'
  });

  // 更新 ref 当状态变化时
  useEffect(() => {
    filterRef.current = {
      searchKeyword,
      filterStatus,
      filterManager,
      filterPriority,
      filterProjectType
    };
  }, [searchKeyword, filterStatus, filterManager, filterPriority, filterProjectType]);

  // 重新加载所有类型的数据
  const fetchProjects = useCallback(async () => {
    try {
      // 清空现有数据，重新按类型加载
      setProjectsByType({});
      
      // 为每个任务类型发送请求
      projectTypes.forEach(type => {
        fetchProjectsByType(type.id.toString(), pagination[type.id.toString()]?.page || 1, pagination[type.id.toString()]?.pageSize || 10);
      });
      // 请求未分类的项目
      fetchProjectsByType('untyped', pagination['untyped']?.page || 1, pagination['untyped']?.pageSize || 10);
    } catch (err) {
      console.error('获取项目列表失败:', err);
    } finally {
      setLoading(false);
    }
  }, [projectTypes, pagination]);

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
        setUsers(result.data.list);
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
      console.error('加载项目类型失败:', err);
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
      projectTypeId: 'none'
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
      projectTypeId: project.project_type_id ? project.project_type_id.toString() : 'none'
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

  // 获取项目状态（优先使用 status 字段，否则根据进度计算）
  const getProjectStatus = (project: any): string => {
    // 如果项目有特殊状态（暂停、终止），直接使用
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
    current_progress: '项目进展详情'
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
        </div>
        <div className="flex gap-2">
          {/* 搜索和过滤器 */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Input
                placeholder="搜索任务名称、描述、编号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-64"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              )}
            </div>

            {/* 状态过滤器 */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="planning">规划中</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="on_hold">已暂停</SelectItem>
                <SelectItem value="cancelled">已终止</SelectItem>
              </SelectContent>
            </Select>

            {/* 负责人过滤器 - 带搜索输入框 */}
            <div className="relative">
              <Input
                placeholder="搜索负责人..."
                value={filterManager === 'all' ? '' : filterManager}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setFilterManager('all');
                  } else {
                    setFilterManager(value);
                  }
                }}
                className="w-40"
              />
              {filterManager !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-2"
                  onClick={() => setFilterManager('all')}
                >
                  ×
                </Button>
              )}
            </div>

            {/* 优先级过滤器 */}
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部优先级</SelectItem>
                <SelectItem value="1">高优先级</SelectItem>
                <SelectItem value="2">中优先级</SelectItem>
                <SelectItem value="3">低优先级</SelectItem>
              </SelectContent>
            </Select>

            {/* 任务类型过滤器 */}
            <Select value={filterProjectType} onValueChange={setFilterProjectType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {projectTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 清除所有过滤器 */}
            {(searchKeyword || filterStatus !== 'all' || filterManager !== 'all' || filterPriority !== 'all' || filterProjectType !== 'all') && (
              <Button
                variant="outline"
                size="sm"
            onClick={() => {
              setSearchKeyword('');
              setFilterStatus('all');
              setFilterManager('all');
              setFilterPriority('all');
              setFilterProjectType('all');
              // 先更新 ref，再请求数据（避免 useEffect 异步延迟）
              filterRef.current = {
                searchKeyword: '',
                filterStatus: 'all',
                filterManager: 'all',
                filterPriority: 'all',
                filterProjectType: 'all'
              };
              // 手动触发重新请求数据
              setLoading(true);
              fetchProjects();
            }}
              >
                清除过滤
              </Button>
            )}
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              {isAdmin && <Button onClick={openNewProjectDialog}>新建任务</Button>}
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? '编辑任务' : '修改任务'}</DialogTitle>
              <DialogDescription>{editingProject ? '修改任务信息' : '填写任务信息'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI 智能创建 */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🤖</span>
                  <span className="font-medium text-purple-700">AI 智能创建</span>
                  <span className="text-xs text-muted-foreground ml-auto">需要 MiniMax API Key</span>
                </div>
                <p className="text-xs text-purple-600 mb-3">用自然语言描述任务，AI 自动提取信息</p>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    placeholder="例如：下周完成用户登录页面 UI 设计，优先级高"
                    className="flex-1 bg-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAiParse();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={handleAiParse}
                    disabled={aiLoading || !aiDescription.trim()}
                    variant="secondary"
                    className="shrink-0"
                  >
                    {aiLoading ? '解析中...' : 'AI 创建'}
                  </Button>
                </div>
                {aiResult && (
                  <div className="mt-3 p-3 bg-white rounded border text-sm">
                    <div className="text-green-600 font-medium mb-1">✓ AI 已提取信息：</div>
                    <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                      <div>名称：{aiResult.name}</div>
                      <div>优先级：{aiResult.priority === 1 ? '低' : aiResult.priority === 2 ? '中' : '高'}</div>
                      {aiResult.endDate && <div>截止：{aiResult.endDate}</div>}
                      <div className="col-span-2">描述：{aiResult.description?.slice(0, 50)}...</div>
                    </div>
                    <Button
                      type="button"
                      onClick={applyAiResult}
                      className="mt-2"
                      size="sm"
                    >
                      应用到表单
                    </Button>
                  </div>
                )}
              </div>

              {/* 任务名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">任务名称 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="请输入任务名称"
                />
              </div>

              {/* 任务目标 */}
              <div className="space-y-2">
                <Label htmlFor="goal">任务目标 *</Label>
                <Textarea
                  id="goal"
                  name="goal"
                  value={formData.goal}
                  onChange={handleInputChange}
                  rows={3}
                  required
                  placeholder="请输入任务目标和预期成果"
                />
              </div>

              {/* 项目类型 */}
              <div className="space-y-2">
                <Label htmlFor="projectType">项目类型</Label>
                <Select
                  value={formData.projectTypeId}
                  onValueChange={(value) => handleSelectChange('projectTypeId', value)}
                >
                  <SelectTrigger id="projectType">
                    <SelectValue placeholder="请选择项目类型（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                          {type.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 负责人 - 搜索框在负责人下面，按列排列，一列5个，横向滚动 */}
              <div className="space-y-2">
                <Label htmlFor="managers">负责人 *</Label>
                <div className="border rounded-md p-4">
                  {/* 搜索框 - 在负责人区域内部 */}
                  <div className="mb-2">
                    <Input
                      id="managerSearch"
                      placeholder="搜索姓名..."
                      value={managerFilter}
                      onChange={(e) => setManagerFilter(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  
                  {/* 负责人列表 - 使用 grid 布局，一行5个，可横向滚动 */}
                  <div 
                    className="overflow-x-auto pb-2"
                    style={{ maxHeight: '200px' }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {filteredUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">暂无用户可选</p>
                      ) : (
                        filteredUsers.map((user) => (
                          <div 
                            key={user.id} 
                            className="flex items-center space-x-1 px-2 py-1 border rounded cursor-pointer hover:bg-accent w-[19%] min-w-[100px]"
                            onClick={() => handleManagerToggle(user.id.toString())}
                          >
                            <input
                              type="checkbox"
                              id={`user-${user.id}`}
                              checked={(formData.managerIds || []).includes(user.id.toString())}
                              onChange={() => handleManagerToggle(user.id.toString())}
                              className="h-3 w-3"
                            />
                            <label
                              htmlFor={`user-${user.id}`}
                              className="text-xs cursor-pointer whitespace-nowrap truncate"
                            >
                              {user.real_name}
                            </label>
                          </div>
                        ))
                      )}
                      {/* 空卡片占位，保持布局 */}
                      {[...Array(5 - (filteredUsers.length % 5))].map((_, i) => (
                        <div key={`empty-${i}`} className="w-[19%] min-w-[100px]" />
                      ))}
                    </div>
                  </div>
                </div>
                {(formData.managerIds || []).length === 0 && (
                  <p className="text-xs text-destructive">请至少选择一位负责人</p>
                )}
                {(formData.managerIds || []).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    已选择 {(formData.managerIds || []).length} 位负责人
                  </p>
                )}
              </div>

              {/* 项目优先级 */}
              <div className="space-y-2">
                <Label htmlFor="priority">项目优先级 *</Label>
                <Select
                  value={formData.priority.toString()}
                  onValueChange={(value) => handleSelectChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - 高</SelectItem>
                    <SelectItem value="2">2 - 中</SelectItem>
                    <SelectItem value="3">3 - 低</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 预期完成日期 */}
              <div className="space-y-2">
                <Label htmlFor="endDate">预期完成日期 *</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="endDate"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      {formData.endDate ? (
                        format(new Date(formData.endDate), "PPP", { locale: zhCN })
                      ) : (
                        <span>请选择日期</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate ? new Date(formData.endDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setFormData({ ...formData, endDate: `${year}-${month}-${day}` });
                          setDatePickerOpen(false);
                        }
                      }}
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 任务进度 */}
              <div className="space-y-2">
                <Label htmlFor="progress">任务进度 (%)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[formData.progress]}
                    onValueChange={(value) => handleSelectChange('progress', value[0].toString())}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-12 text-right">{formData.progress}%</span>
                </div>
              </div>

              {/* 项目进展详情 */}
              <div className="space-y-2">
                <Label htmlFor="currentProgress">项目进展详情</Label>
                <Textarea
                  id="currentProgress"
                  name="currentProgress"
                  value={formData.currentProgress}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="描述项目的当前进展情况..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      {editingProject ? '更新中...' : '创建中...'}
                    </>
                  ) : (
                    editingProject ? '更新' : '创建'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
          
          // 渲染表头
          const renderHeader = () => (
            <div className="grid grid-cols-12 gap-4 py-2 px-4 bg-gray-50 rounded-t-lg border-b font-medium text-xs text-muted-foreground">
              <div className="col-span-2">任务标题</div>
              <div className="col-span-1">任务类型</div>
              <div className="col-span-1">优先级</div>
              <div className="col-span-1">负责人</div>
              <div className="col-span-1">预期完成</div>
              <div className="col-span-2">进度</div>
              <div className="col-span-1">状态</div>
              <div className="col-span-3 text-right">操作</div>
            </div>
          );

          // 渲染项目列表项
          const renderProjectItem = (project: any, showType: boolean = false) => (
            <div 
              key={project.id} 
              className="grid grid-cols-12 gap-4 py-3 px-4 hover:bg-accent/30 transition-colors border-b border-border/50 items-center"
            >
              {/* 任务标题 */}
              <div className="col-span-2 min-w-0">
                <span 
                  className="font-medium text-sm truncate cursor-pointer hover:text-blue-600 block"
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                >
                  {project.name}
                </span>
              </div>
              
              {/* 任务类型 */}
              <div className="col-span-1">
                {project.project_type_name ? (
                  <Badge variant="outline" className="text-xs">{project.project_type_name}</Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">-</span>
                )}
              </div>
              
              {/* 任务优先级 */}
              <div className="col-span-1">
                <Badge className={`text-xs ${Number(project.priority) === 1 ? 'bg-red-500' : Number(project.priority) === 2 ? 'bg-orange-500' : 'bg-gray-500'}`}>
                  {Number(project.priority) === 1 ? '高' : Number(project.priority) === 2 ? '中' : '低'}
                </Badge>
              </div>
              
              {/* 负责人 */}
              <div className="col-span-1">
                <span className="text-xs truncate block">{project.manager_name || '-'}</span>
              </div>
              
              {/* 预期完成时间 */}
              <div className="col-span-1">
                <span className="text-xs">{toLocalDateString(project.end_date) || '-'}</span>
              </div>
              
              {/* 进度条 */}
              <div className="col-span-2 flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${getProjectStatus(project) === 'completed' ? 'bg-green-500' : getProjectStatus(project) === 'overdue' ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground w-10">{project.progress || 0}%</span>
              </div>
              
              {/* 任务状态 */}
              <div className="col-span-1">
                <Badge className={`text-xs ${statusColors[getProjectStatus(project)] || 'bg-gray-500'}`}>
                  {statusLabels[getProjectStatus(project)] || '未知'}
                </Badge>
              </div>
              
              {/* 操作按钮 */}
              <div className="col-span-3 flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push(`/dashboard/projects/${project.id}`)}
                  className="text-xs h-7"
                >
                  详情
                </Button>
                {isAdmin && ['planning', 'in_progress', 'overdue'].includes(getProjectStatus(project)) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleUrge(project.id)}
                    disabled={urgingProjectId === project.id}
                    className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {urgingProjectId === project.id ? '催办中...' : '催一下'}
                  </Button>
                )}
              </div>
            </div>
          );
          
          // 渲染分页组件
          const renderPagination = (typeId: string, total: number, onPageChange: (page: number, pageSize: number) => void, currentPage: number, currentPageSize: number) => {
            const totalPages = Math.ceil(total / currentPageSize) || 1;
            const startIdx = (currentPage - 1) * currentPageSize;
            const endIdx = Math.min(startIdx + currentPageSize, total);
            
            return (
              <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50 rounded-b-lg">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    显示 {startIdx + 1}-{endIdx} 共 {total} 条
                  </span>
                  <Select 
                    value={currentPageSize.toString()} 
                    onValueChange={(value) => onPageChange(1, parseInt(value))}
                  >
                    <SelectTrigger className="h-7 w-20 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10/页</SelectItem>
                      <SelectItem value="20">20/页</SelectItem>
                      <SelectItem value="30">30/页</SelectItem>
                      <SelectItem value="40">40/页</SelectItem>
                      <SelectItem value="50">50/页</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onPageChange(1, currentPageSize)}
                    disabled={currentPage <= 1}
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onPageChange(currentPage - 1, currentPageSize)}
                    disabled={currentPage <= 1}
                  >
                    ‹
                  </Button>
                  <span className="text-xs px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onPageChange(currentPage + 1, currentPageSize)}
                    disabled={currentPage >= totalPages}
                  >
                    ›
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onPageChange(totalPages, currentPageSize)}
                    disabled={currentPage >= totalPages}
                  >
                    »
                  </Button>
                </div>
              </div>
            );
          };
          
          // 分页处理 - 后端分页模式下直接返回所有数据（API已经返回了当前页的数据）
          const getPaginatedProjects = (typeId: string, projects: any[]) => {
            // 后端分页模式：API已经返回了当前页的数据，不再做前端分页切片
            return sortByStatus(projects);
          };

          const handlePageChange = (typeId: string, page: number, pageSize: number) => {
            setPagination(prev => ({
              ...prev,
              [typeId]: { page, pageSize }
            }));
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
                    {renderHeader()}
                    {/* 数据列表 */}
                    <div className="space-y-1 bg-white">
                      {getPaginatedProjects(type.id.toString(), typeProjects).map(project => renderProjectItem(project, false))}
                      {getPaginatedProjects(type.id.toString(), typeProjects).length === 0 && (
                        <div className="py-8 text-center text-muted-foreground text-sm">该类型暂无任务</div>
                      )}
                    </div>
                    {/* 分页 */}
                    {(projectCounts[type.id.toString()] || 0) > 0 && renderPagination(type.id.toString(), projectCounts[type.id.toString()] || 0, (page, pageSize) => handlePageChange(type.id.toString(), page, pageSize), pageConfig.page, pageConfig.pageSize)}
                  </Card>
                );
              })}
              
              {/* 未分类的任务 */}
              {(projectsByType['untyped']?.length || 0) > 0 && (
                <Card key="untyped" className="overflow-hidden">
                  <CardHeader className="pb-3 bg-white">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-gray-400" />
                      <CardTitle className="text-lg">未分类</CardTitle>
                      <Badge variant="secondary">{projectCounts['untyped'] || 0} 个任务</Badge>
                    </div>
                  </CardHeader>
                  {/* 表头 */}
                  {renderHeader()}
                  {/* 数据列表 */}
                  <div className="space-y-1 bg-white">
                    {getPaginatedProjects('untyped', projectsByType['untyped'] || []).map(project => renderProjectItem(project, true))}
                  </div>
                  {/* 分页 */}
                  {(projectCounts['untyped'] || 0) > 0 && renderPagination('untyped', projectCounts['untyped'] || 0, (page, pageSize) => handlePageChange('untyped', page, pageSize), (pagination['untyped'] || { page: 1, pageSize: 10 }).page, (pagination['untyped'] || { page: 1, pageSize: 10 }).pageSize)}
                </Card>
              )}
              
              {/* 没有任何项目时显示提示 */}
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
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>项目操作记录</DialogTitle>
            <DialogDescription>查看项目的所有操作历史</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {logsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : projectLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无操作记录
              </p>
            ) : (
              projectLogs.map((log: any) => (
                <div key={log.id} className="border rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={actionColors[log.action] || 'bg-gray-500'}>
                        {actionLabels[log.action] || log.action}
                      </Badge>
                      <span className="font-medium">{log.operator_name || '未知用户'}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 团队成员对话框 */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>团队成员管理</DialogTitle>
            <DialogDescription>
              项目：{selectedProjectForTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 添加成员 */}
            {isAdmin && (
              <div className="flex gap-2">
                <Select value={newMember.userId} onValueChange={v => setNewMember({ ...newMember, userId: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="选择用户" /></SelectTrigger>
                  <SelectContent>
                    {users.filter(u => !teamMembers.some(m => m.user_id === u.id)).map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>{u.real_name || u.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={newMember.role} onValueChange={v => setNewMember({ ...newMember, role: v })}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">成员</SelectItem>
                    <SelectItem value="leader">负责人</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddMember} disabled={addingMember || !newMember.userId}>添加</Button>
              </div>
            )}
            {/* 成员列表 */}
            {teamLoading ? (
              <div className="text-center py-4">加载中...</div>
            ) : teamMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">暂无团队成员</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {teamMembers.map(member => (
                  <div key={member.id} className="flex items-center gap-3 p-3 border rounded-md">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                      {(member.real_name || member.username || '?').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{member.real_name || member.username}</p>
                      <p className="text-xs text-muted-foreground">{member.role === 'leader' ? '负责人' : '成员'}</p>
                    </div>
                    {isAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)} className="text-red-500">移除</Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 终止任务对话框 */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>终止任务</DialogTitle>
            <DialogDescription>
              您确定要终止任务"{selectedProject?.name}"吗？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terminateReason">终止原因 *</Label>
              <Textarea
                id="terminateReason"
                value={terminateReason}
                onChange={(e) => setTerminateReason(e.target.value)}
                placeholder="请输入终止原因..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTerminateDialogOpen(false);
                  setTerminateReason('');
                  setSelectedProject(null);
                }}
                disabled={terminating}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleTerminateProject}
                disabled={terminating}
              >
                {terminating ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    终止中...
                  </>
                ) : (
                  '确认终止'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 暂停任务对话框 */}
      <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>暂停任务</DialogTitle>
            <DialogDescription>
              您确定要暂停任务"{selectedProject?.name}"吗？
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pauseReason">暂停原因 *</Label>
              <Textarea
                id="pauseReason"
                value={pauseReason}
                onChange={(e) => setPauseReason(e.target.value)}
                placeholder="请输入暂停原因..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPauseDialogOpen(false);
                  setPauseReason('');
                  setSelectedProject(null);
                }}
                disabled={pausing}
              >
                取消
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={handlePauseProject}
                disabled={pausing}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {pausing ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    暂停中...
                  </>
                ) : (
                  '确认暂停'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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
}
