'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, 
  DialogTrigger, DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

// 状态颜色映射
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

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // 编辑对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [projectTypes, setProjectTypes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [managerFilter, setManagerFilter] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: '',
    current_progress: '',
    progress: 0,
    managerIds: [] as string[],
    end_date: '',
    priority: '2',
    module_id: '',
    project_type_id: '',
  });
const [submitting, setSubmitting] = useState(false);

  // 删除状态
  const [deleting, setDeleting] = useState(false);

  // 暂停对话框
  const [pauseDialogOpen, setPauseDialogOpen] = useState(false);
  const [pauseReason, setPauseReason] = useState('');
  const [pausing, setPausing] = useState(false);

  // 终止对话框
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [projectId]);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.success) {
        router.push('/');
        return;
      }

      setUser(data.data);
      setIsAdmin(data.data.role === 'admin');
      fetchProject();
      fetchProjectTypes();
      fetchUsers();
      fetchModules();
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/');
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/project-types', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setProjectTypes(result.data);
      }
    } catch (err) {
      console.error('加载项目类型失败:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setUsers((result.data.list || []).filter((u: any) => u.username !== 'admin'));
      }
    } catch (err) {
      console.error('加载用户列表失败:', err);
    }
  };

  const [modules, setModules] = useState<any[]>([]);

  const fetchModules = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/modules', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        setModules(result.data);
      }
    } catch (err) {
      console.error('加载模块列表失败:', err);
    }
  };

  const fetchProject = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setProject(data.data);
        setEditingProject(data.data);
        
        // 将 manager_name 转换为 managerIds
        let managerIds: string[] = [];
        if (data.data.manager_name) {
          const managerNames = data.data.manager_name.split(',').map((n: string) => n.trim());
          // 等待 users 加载完成后再匹配
          const token2 = localStorage.getItem('token');
          fetch('/api/users', {
            headers: { Authorization: `Bearer ${token2}` }
          }).then(res => res.json()).then(usersResult => {
            if (usersResult.success) {
              const matchedIds = usersResult.data.list
                .filter((u: any) => managerNames.includes(u.real_name) || managerNames.includes(u.username))
                .map((u: any) => u.id.toString());
              setFormData(prev => ({ ...prev, managerIds: matchedIds }));
            }
          });
        }
        
        setFormData({
          name: data.data.name || '',
          description: data.data.description || '',
          goal: data.data.goal || data.data.description || '',
          current_progress: data.data.current_progress || '',
          progress: parseInt(data.data.progress) || 0,
          managerIds: managerIds,
          end_date: data.data.end_date ? data.data.end_date.split('T')[0] : '',
          priority: data.data.priority || '2',
          module_id: data.data.module_id ? data.data.module_id.toString() : '',
          project_type_id: data.data.project_type_id ? data.data.project_type_id.toString() : '',
        });
      }
    } catch (error) {
      console.error('获取任务详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManagerToggle = (userId: string) => {
    setFormData(prev => {
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProgressChange = (value: number[]) => {
    setFormData(prev => ({ ...prev, progress: value[0] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // 将 managerIds 转换为 manager_name
      let managerName = '';
      let managerPhone = '';
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
      
      // 构建更新数据
      const updateData = {
        name: formData.name,
        description: formData.goal,
        goal: formData.goal,
        current_progress: formData.current_progress,
        progress: formData.progress,
        managerName: managerName,
        managerPhone: managerPhone,
        endDate: formData.end_date,
        priority: formData.priority,
        projectTypeId: formData.project_type_id ? parseInt(formData.project_type_id) : null,
        moduleId: formData.module_id ? parseInt(formData.module_id) : null,
      };

      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await res.json();

      if (result.success) {
        alert('任务更新成功');
        setEditDialogOpen(false);
        fetchProject();
      } else {
        alert(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新任务失败:', error);
      alert('更新任务失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();

      if (result.success) {
        alert('任务删除成功');
        router.push('/dashboard/projects');
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除任务失败:', error);
      alert('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  // 处理暂停
  const handlePause = async () => {
    if (!pauseReason.trim()) {
      alert('请输入暂停理由');
      return;
    }
    setPausing(true);
    try {
      const token = localStorage.getItem('token');
      // 使用专门的暂停 API，不会修改其他字段
      const res = await fetch(`/api/projects/${projectId}/pause`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          reason: pauseReason
        })
      });

      const result = await res.json();

      if (result.success) {
        alert('任务已暂停');
        setPauseDialogOpen(false);
        setPauseReason('');
        fetchProject();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('暂停任务失败:', error);
      alert('操作失败');
    } finally {
      setPausing(false);
    }
  };

  // 处理终止
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('请输入终止理由');
      return;
    }
    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      // 使用专门的终止 API，不会修改其他字段
      const res = await fetch(`/api/projects/${projectId}/terminate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          reason: cancelReason
        })
      });

      const result = await res.json();

      if (result.success) {
        alert('任务已终止');
        setCancelDialogOpen(false);
        setCancelReason('');
        fetchProject();
      } else {
        alert(result.message || '操作失败');
      }
    } catch (error) {
      console.error('终止任务失败:', error);
      alert('操作失败');
    } finally {
      setCancelling(false);
    }
  };

  const getProjectStatus = (project: any) => {
    if (project.status === 'cancelled') return 'cancelled';
    if (project.status === 'on_hold') return 'on_hold';
    if (parseFloat(project.progress) >= 100) return 'completed';
    // 判断是否超期
    if (project.end_date && new Date() > new Date(project.end_date)) {
      return 'overdue';
    }
    if (parseFloat(project.progress) > 0) return 'in_progress';
    return 'planning';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-500">任务不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard/projects')}
          className="mb-4"
        >
          ← 返回任务列表
        </Button>

        {/* 任务详情卡片 */}
        <Card>
          <CardContent className="p-6">
            {/* 标题和状态 */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
                <p className="text-muted-foreground">{project.description || '无描述'}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${statusColors[getProjectStatus(project)] || 'bg-gray-500'} text-white`}>
                  {statusLabels[getProjectStatus(project)] || '?'}
                </Badge>
              </div>
            </div>

            {/* 任务目标 */}
            {project.goal && (
              <div className="mb-6 p-4 bg-muted rounded-lg">
                <div className="text-sm font-medium text-muted-foreground mb-2">任务目标</div>
                <div className="text-sm">{project.goal}</div>
              </div>
            )}

            {/* 进度条 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">任务进度</span>
                <span className="text-sm">{project.progress}%</span>
              </div>
              <Progress value={parseInt(project.progress) || 0} className="h-3" />
            </div>

            {/* 项目类型 */}
            <div className="mb-6">
              <span className="text-muted-foreground text-sm">项目类型</span>
              <div className="font-medium">
                {project.project_type_name || '-'}
              </div>
            </div>

            {/* 预期完成日期 */}
            <div>
                <span className="text-muted-foreground text-sm">预期完成日期</span>
                <div className="font-medium">
                  {project.end_date ? (() => {
                    const date = new Date(project.end_date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  })() : '-'}
                </div>
              </div>

            {/* 负责人 */}
            <div>
                <span className="text-muted-foreground text-sm">负责人</span>
                <div className="font-medium">
                  {project.manager_name || '-'}
                </div>
              </div>

            {/* 负责人电话 */}
            {project.manager_phone && (
              <div>
                <span className="text-muted-foreground text-sm">负责人电话</span>
                <div className="font-medium">
                  {project.manager_phone}
                </div>
              </div>
            )}

            {/* 模块 */}
            {project.module_name && (
              <div>
                <span className="text-muted-foreground text-sm">所属模块</span>
                <div className="font-medium">
                  {project.module_name}
                </div>
              </div>
            )}

            {/* 当前进展 */}
            {project.current_progress && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg border">
                <div className="text-sm font-medium text-blue-800 mb-2">当前进展</div>
                <div className="text-sm text-blue-700 whitespace-pre-wrap">{project.current_progress}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 底部操作按钮 */}
        <div className="mt-6 flex gap-4 justify-center">
          {/* 所有人可以编辑 */}
          <Button 
            onClick={() => setEditDialogOpen(true)}
            className="px-8"
          >
            编辑
          </Button>
          
          {/* 暂停按钮 - 只有在非暂停、非终止和已完成状态下显示 */}
          {project.status !== 'on_hold' && project.status !== 'cancelled' && project.status !== 'completed' && (
            <Button 
              variant="outline"
              onClick={() => setPauseDialogOpen(true)}
              className="px-8"
            >
              暂停
            </Button>
          )}

          {/* 终止按钮 - 只有在非终止和非完成状态下显示 */}
          {project.status !== 'cancelled' && project.status !== 'completed' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="secondary" className="px-8">
                  终止
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认终止任务</AlertDialogTitle>
                  <AlertDialogDescription>
                    请输入终止理由（必填）
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="请输入终止理由..."
                  className="min-h-[100px]"
                />
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setCancelReason('')}>取消</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? '终止中...' : '确认终止'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {/* 只有管理员可以删除 */}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="px-8">
                  删除
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
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? '删除中...' : '确认删除'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* 暂停对话框 */}
        <Dialog open={pauseDialogOpen} onOpenChange={setPauseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>暂停任务</DialogTitle>
              <DialogDescription>
                请输入暂停理由（必填）
              </DialogDescription>
            </DialogHeader>
            <Textarea 
              value={pauseReason}
              onChange={(e) => setPauseReason(e.target.value)}
              placeholder="请输入暂停理由..."
              className="min-h-[100px]"
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setPauseDialogOpen(false); setPauseReason(''); }}>
                取消
              </Button>
              <Button type="button" onClick={handlePause} disabled={pausing}>
                {pausing ? '保存中...' : '确认暂停'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 编辑对话框 */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑任务</DialogTitle>
              <DialogDescription>修改任务信息</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 任务名称 */}
              <div className="space-y-2">
                <Label htmlFor="name">任务名称 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
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
                  rows={4}
                  placeholder="描述任务的主要目标"
                  required
                />
              </div>

              {/* 任务进展 */}
              <div className="space-y-2">
                <Label htmlFor="current_progress">任务进展</Label>
                <Textarea
                  id="current_progress"
                  name="current_progress"
                  value={formData.current_progress || ''}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="填写任务的当前进展情况"
                />
              </div>

              {/* 负责人 - 复选框样式 */}
              <div className="space-y-2">
                <Label htmlFor="managers">负责人</Label>
                <div className="border rounded-md p-4">
                  {/* 搜索框 */}
                  <div className="mb-2">
                    <Input
                      id="managerSearch"
                      placeholder="搜索姓名..."
                      value={managerFilter}
                      onChange={(e) => setManagerFilter(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  
                  {/* 负责人列表 */}
                  <div className="overflow-x-auto pb-2" style={{ maxHeight: '200px' }}>
                    <div className="flex flex-wrap gap-2">
                      {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">暂无用户可选</p>
                      ) : (
                        users
                          .filter(u => u.username !== 'admin' && (!managerFilter || (u.real_name || u.username || '').toLowerCase().includes(managerFilter.toLowerCase())))
                          .map((user) => (
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
                                {user.real_name || user.username}
                              </label>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                </div>
                {(formData.managerIds || []).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    已选择 {(formData.managerIds || []).length} 位负责人
                  </p>
                )}
              </div>

              {/* 预期完成日期 */}
              <div className="space-y-2">
                <Label htmlFor="end_date">预期完成日期</Label>
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.end_date && "text-muted-foreground"
                      )}
                      onClick={() => setDatePickerOpen(true)}
                    >
                      {formData.end_date ? (
                        format(new Date(formData.end_date), "PPP", { locale: zhCN })
                      ) : (
                        <span>请选择日期</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date ? new Date(formData.end_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          setFormData({ ...formData, end_date: `${year}-${month}-${day}` });
                          setDatePickerOpen(false);
                        }
                      }}
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 优先级 */}
              <div className="space-y-2">
                <Label htmlFor="priority">优先级</Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="1">高优先级</option>
                  <option value="2">中优先级</option>
                  <option value="3">低优先级</option>
                </select>
              </div>

              {/* 项目类型 */}
              <div className="space-y-2">
                <Label htmlFor="project_type">项目类型</Label>
                <Select
                  value={formData.project_type_id || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_type_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger id="project_type">
                    <SelectValue placeholder="请选择项目类型" />
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

              {/* 模块选择 */}
              <div className="space-y-2">
                <Label htmlFor="module_id">所属模块</Label>
                <Select
                  value={formData.module_id || 'none'}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger id="module_id">
                    <SelectValue placeholder="请选择所属模块" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {modules.map((mod) => (
                      <SelectItem key={mod.id} value={mod.id.toString()}>
                        {mod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 进度 */}
              <div className="space-y-2">
                <Label>任务进度 ({formData.progress}%)</Label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => handleProgressChange([parseInt(e.target.value)])}
                  className="w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '保存中...' : '保存'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
