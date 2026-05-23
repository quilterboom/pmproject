'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
  // 里程碑相关
  const [milestoneDialogOpen, setMilestoneDialogOpen] = useState(false);
  const [selectedProjectForMilestone, setSelectedProjectForMilestone] = useState<any>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ name: '', dueDate: '' });
  const [addingMilestone, setAddingMilestone] = useState(false);
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

  useEffect(() => {
    // 获取用户信息
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setIsAdmin(parsedUser.role === 'admin');
    }
    
    fetchProjects();
    fetchUsers();
    fetchProjectTypes();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchKeyword) {
        params.append('keyword', searchKeyword);
      }
      if (filterStatus && filterStatus !== 'all') {
        params.append('status', filterStatus);
      }
      if (filterManager && filterManager !== 'all') {
        params.append('manager_name', filterManager);
      }
      if (filterPriority && filterPriority !== 'all') {
        params.append('priority', filterPriority);
      }
      if (filterProjectType && filterProjectType !== 'all') {
        params.append('project_type_id', filterProjectType);
      }

      const response = await fetch(`/api/projects?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setProjects(result.data.list);
      }
    } catch (err) {
      console.error('获取项目列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  // 监听搜索和过滤条件变化，自动重新获取项目列表
  useEffect(() => {
    // 跳过首次渲染（loading 为 true）
    if (loading === true) return;
    
    const timer = setTimeout(() => {
      setLoading(true);
      fetchProjects();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchKeyword, filterStatus, filterManager, filterPriority, filterProjectType]);

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

  // 里程碑相关函数
  const openMilestoneDialog = async (project: any) => {
    setSelectedProjectForMilestone(project);
    setMilestoneDialogOpen(true);
    setMilestoneLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/milestones?project_id=${project.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setMilestones(result.data || []);
      }
    } catch (err) {
      console.error('获取里程碑失败:', err);
    } finally {
      setMilestoneLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.name.trim() || !selectedProjectForMilestone) return;
    setAddingMilestone(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          projectId: selectedProjectForMilestone.id,
          name: newMilestone.name,
          dueDate: newMilestone.dueDate || null
        })
      });
      setNewMilestone({ name: '', dueDate: '' });
      openMilestoneDialog(selectedProjectForMilestone);
    } catch (err) {
      alert('添加里程碑失败');
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleToggleMilestone = async (milestone: any) => {
    const token = localStorage.getItem('token');
    await fetch('/api/milestones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ id: milestone.id, completed: !milestone.completed })
    });
    openMilestoneDialog(selectedProjectForMilestone);
  };

  const handleDeleteMilestone = async (id: number) => {
    if (!confirm('确定删除此里程碑？')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/milestones?id=${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    openMilestoneDialog(selectedProjectForMilestone);
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

      {/* 视图渲染 */}
      {viewMode === 'gantt' ? (
        /* 甘特图视图 */
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <div className="min-w-[800px] bg-white rounded-lg border">
              {/* 甘特图头部 */}
              <div className="flex border-b bg-gray-50 sticky top-0">
                <div className="w-48 p-3 font-semibold text-sm">任务名称</div>
                <div className="w-24 p-3 font-semibold text-sm text-center">状态</div>
                <div className="w-24 p-3 font-semibold text-sm text-center">进度</div>
                <div className="flex-1 p-3 font-semibold text-sm">时间线 (2026年)</div>
              </div>
              {/* 甘特图内容 */}
              {projects.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">暂无项目</div>
              ) : (
                projects.map((project) => {
                  const startDate = project.start_date ? new Date(project.start_date) : new Date('2026-01-01');
                  const endDate = project.end_date ? new Date(project.end_date) : new Date('2026-12-31');
                  const yearStart = new Date('2026-01-01');
                  const yearEnd = new Date('2026-12-31');
                  const totalDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24);
                  const startOffset = Math.max(0, (startDate.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
                  const duration = Math.min(totalDays - startOffset, (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                  const leftPercent = (startOffset / totalDays) * 100;
                  const widthPercent = (duration / totalDays) * 100;
                  
                  return (
                    <div key={project.id} className="flex border-b hover:bg-gray-50">
                      <div className="w-48 p-3 text-sm font-medium truncate">{project.name}</div>
                      <div className="w-32 p-3 text-sm text-center">
                        <Badge className={statusColors[getProjectStatus(project)] || 'bg-gray-500'}>{statusLabels[getProjectStatus(project)] || '未知'}</Badge>
                      </div>
                      <div className="w-24 p-3 text-sm text-center">{project.progress || 0}%</div>
                      <div className="flex-1 p-2 relative">
                        <div className="h-6 bg-gray-100 rounded relative">
                          {startDate && endDate && (
                            <div 
                              className={`absolute h-full rounded ${getProjectStatus(project) === 'completed' ? 'bg-green-500' : getProjectStatus(project) === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'}`}
                              style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                            />
                          )}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{project.start_date ? format(new Date(project.start_date), 'MM-dd') : '-'}</span>
                          <span>{project.end_date ? format(new Date(project.end_date), 'MM-dd') : '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : viewMode === 'card' ? (
        /* 卡片视图 */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.length === 0 ? (
            <Card className="col-span-full"><CardContent className="py-10 text-center text-muted-foreground">暂无项目</CardContent></Card>
          ) : (
            projects.map((project) => (
              <Card 
                key={project.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/dashboard/projects/${project.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{project.name}</h3>
                      <p className="text-xs text-muted-foreground truncate">{project.description || '无描述'}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={statusColors[getProjectStatus(project)] || 'bg-gray-500'}>{statusLabels[getProjectStatus(project)] || '?'}</Badge>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>进度</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProjectStatus(project) === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {project.project_type_name && <Badge variant="outline">{project.project_type_name}</Badge>}
                    <Badge variant="outline" className={priorityColors[project.priority]}>{priorityLabels[project.priority]}优先级</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    <span>负责人: {project.manager_name || '-'}</span>
                    <span className="ml-4">预期完成: {toLocalDateString(project.end_date) || '-'}</span>
                  </div>
                  {/* 催办按钮 - 卡片视图 */}
                  {isAdmin && ['planning', 'in_progress', 'overdue'].includes(getProjectStatus(project)) && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUrge(project.id);
                      }}
                      disabled={urgingProjectId === project.id}
                      className="mt-3 w-full bg-red-500 hover:bg-red-600 text-white"
                    >
                      {urgingProjectId === project.id ? '催办中...' : '催一下'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        /* 列表视图 */
        <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                </div>
                <div className="flex gap-2 items-center">
                  {project.project_type_name && (
                    <Badge
                      variant="outline"
                    >
                      {project.project_type_name}
                    </Badge>
                  )}
                  <Badge className={statusColors[getProjectStatus(project)] || 'bg-gray-500'}>
                    {statusLabels[getProjectStatus(project)] || '未知'}
                  </Badge>
                  <Badge className={priorityColors[project.priority]} variant="secondary">
                    优先级 {project.priority} - {priorityLabels[project.priority]}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">项目类型：</span>
                  <span className="font-medium">{project.project_type_name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">负责人：</span>
                  <span className="font-medium">{project.manager_name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">预期完成日期：</span>
                  <span className="font-medium">{toLocalDateString(project.end_date) || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">任务进度：</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
              </div>

              {/* 进度条显示 */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">任务进度</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>

              {/* 当前进展数据框 */}
              {project.current_progress && (
                <div className="mb-4 p-4 bg-muted rounded-md border">
                  <div className="text-sm font-medium mb-2 text-muted-foreground">当前进展</div>
                  <div className="text-sm whitespace-pre-wrap">{project.current_progress}</div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                {isAdmin && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(project)}
                    >
                      编辑
                    </Button>
                    {/* 催办按钮 */}
                    {isAdmin && ['planning', 'in_progress', 'overdue'].includes(getProjectStatus(project)) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUrge(project.id);
                        }}
                        disabled={urgingProjectId === project.id}
                        className="text-blue-600 hover:bg-blue-50"
                      >
                        {urgingProjectId === project.id ? '催办中...' : '催一下'}
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchProjectLogs(project.id)}
                  disabled={logsLoading}
                >
                  {logsLoading ? '加载中...' : '操作记录'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openMilestoneDialog(project)}
                >
                  里程碑
                </Button>
                {isAdmin && parseFloat(project.progress) < 100 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPauseDialog(project)}
                      className="text-orange-600 hover:bg-orange-50"
                      disabled={pausing}
                    >
                      暂停
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTerminateDialog(project)}
                      className="text-red-600 hover:bg-red-50"
                      disabled={terminating}
                    >
                      终止
                    </Button>
                  </>
                )}
                {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={deleting}
                    >
                      {deleting ? '删除中...' : '删除'}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认删除任务</AlertDialogTitle>
                      <AlertDialogDescription>
                        您确定要删除任务"{project.name}"吗？此操作不可撤销，所有相关数据将被永久删除。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? (
                          <>
                            <span className="animate-spin mr-2">⟳</span>
                            删除中...
                          </>
                        ) : (
                          '确认删除'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

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

      {/* 里程碑对话框 */}
      <Dialog open={milestoneDialogOpen} onOpenChange={setMilestoneDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>里程碑管理</DialogTitle>
            <DialogDescription>
              项目：{selectedProjectForMilestone?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* 添加里程碑 */}
            {isAdmin && (
              <div className="flex gap-2">
                <Input
                  placeholder="里程碑名称"
                  value={newMilestone.name}
                  onChange={(e) => setNewMilestone({ ...newMilestone, name: e.target.value })}
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={newMilestone.dueDate}
                  onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
                  className="w-36"
                />
                <Button onClick={handleAddMilestone} disabled={addingMilestone || !newMilestone.name.trim()}>
                  添加
                </Button>
              </div>
            )}
            {/* 里程碑列表 */}
            {milestoneLoading ? (
              <div className="text-center py-4">加载中...</div>
            ) : milestones.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">暂无里程碑</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className={`flex items-center gap-2 p-3 border rounded-md ${milestone.completed ? 'bg-green-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!milestone.completed}
                      onChange={() => handleToggleMilestone(milestone)}
                      className="w-4 h-4"
                    />
                    <span className={`flex-1 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {milestone.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString('zh-CN') : ''}
                    </span>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMilestone(milestone.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
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
