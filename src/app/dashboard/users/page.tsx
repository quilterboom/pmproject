'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, Key } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 保存滚动位置
  const [scrollPosition, setScrollPosition] = useState(0);
  
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // 关闭时恢复滚动位置
      window.scrollTo(0, scrollPosition);
    } else {
      // 打开时保存当前位置
      setScrollPosition(window.scrollY);
    }
    setDialogOpen(open);
  };
  
  // 过滤用户
  const filteredUsers = searchQuery
    ? users.filter(u => 
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.real_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [departments, setDepartments] = useState<any[]>([]);
  const [offices, setOffices] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [modulesLoaded, setModulesLoaded] = useState<Record<string, boolean>>({});
  const [officesLoaded, setOfficesLoaded] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    departmentId: '',
    officeId: '',
    moduleId: '',
    role: 'member'
  });

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (formData.departmentId) {
      fetchOffices(formData.departmentId);
    }
  }, [formData.departmentId]);

  useEffect(() => {
    if (formData.officeId) {
      fetchModules(formData.officeId);
    }
  }, [formData.officeId]);

  const loadCurrentUser = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  };

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
      console.error('获取用户列表失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const result = await response.json();
      if (result.success) {
        setDepartments(result.data);
      }
    } catch (err) {
      console.error('加载部门列表失败:', err);
    }
  };

  const fetchOffices = async (deptId: string): Promise<any[]> => {
    // 每次编辑时清空了缓存，这里直接请求
    try {
      const response = await fetch(`/api/offices?department_id=${deptId}`);
      const result = await response.json();
      if (result.success) {
        setOffices(result.data);
        setOfficesLoaded(prev => ({ ...prev, [deptId]: true }));
      }
      return result.data || [];
    } catch (err) {
      console.error('加载科室列表失败:', err);
      return [];
    }
  };

  const fetchModules = async (officeId: string): Promise<any[]> => {
    // 每次编辑时清空了缓存，这里直接请求
    try {
      const response = await fetch(`/api/modules?office_id=${officeId}`);
      const result = await response.json();
      if (result.success) {
        setModules(result.data);
        setModulesLoaded(prev => ({ ...prev, [officeId]: true }));
      }
      return result.data || [];
    } catch (err) {
      console.error('加载模块列表失败:', err);
      return [];
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    const newFormData = {
      ...formData,
      [name]: value
    };

    // 当改变部门时，清空科室和模块选择
    if (name === 'departmentId' && value !== formData.departmentId) {
      newFormData.officeId = '';
      newFormData.moduleId = '';
    }

    // 当改变科室时，清空模块选择
    if (name === 'officeId' && value !== formData.officeId) {
      newFormData.moduleId = '';
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');

      if (isEditMode && editingUserId) {
        // 编辑模式：不发送密码字段
        const { password, ...dataWithoutPassword } = formData;
        const response = await fetch(`/api/users/${editingUserId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(dataWithoutPassword)
        });
        const result = await response.json();
        if (result.success) {
          setDialogOpen(false);
          resetForm();
          fetchUsers();
        } else {
          alert(result.message || '更新用户失败');
        }
      } else {
        // 创建模式：发送所有字段包括密码
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        });
        const result = await response.json();
        if (result.success) {
          setDialogOpen(false);
          resetForm();
          fetchUsers();
        } else {
          alert(result.message || '创建用户失败');
        }
      }
    } catch (err) {
      alert(isEditMode ? '更新用户失败' : '创建用户失败');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      realName: '',
      email: '',
      phone: '',
      departmentId: '',
      officeId: '',
      moduleId: '',
      role: 'member'
    });
    setIsEditMode(false);
    setEditingUserId(null);
  };

  const handleEditUser = async (user: any) => {
    setIsEditMode(true);
    setEditingUserId(user.id);

    // 清空缓存，强制重新加载
    setModulesLoaded({});
    setOfficesLoaded({});
    
    // 先清空列表
    setOffices([]);
    setModules([]);
    
    // 先设置表单数据（包含科室和模块）
    setFormData({
      username: user.username,
      password: '',
      realName: user.real_name,
      email: user.email || '',
      phone: user.phone || '',
      departmentId: user.department_id?.toString() || '',
      officeId: user.office_id?.toString() || '',
      moduleId: user.module_id?.toString() || '',
      role: user.role || 'member',
      status: user.status || 'active'
    });
    
    try {
      // 加载科室
      if (user.department_id) {
        const officeList = await fetchOffices(user.department_id.toString());
        setOffices(officeList);
      }

      // 加载模块
      if (user.office_id) {
        const moduleList = await fetchModules(user.office_id.toString());
        setModules(moduleList);
      }

      setDialogOpen(true);
    } catch (error) {
      console.error('加载数据失败:', error);
      setDialogOpen(true);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setDeletingUserId(userId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${deletingUserId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setDeleteDialogOpen(false);
        fetchUsers();
      } else {
        alert(result.message || '删除用户失败');
      }
    } catch (err) {
      alert('删除用户失败');
    }
  };

  const handleOpenPasswordDialog = (userId: number) => {
    setPasswordUserId(userId);
    setNewPassword('');
    setPasswordDialogOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUserId || !newPassword) {
      alert('请输入新密码');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${passwordUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password: newPassword })
      });
      const result = await response.json();
      if (result.success) {
        setPasswordDialogOpen(false);
        setNewPassword('');
        alert('密码重置成功');
      } else {
        alert(result.message || '重置密码失败');
      }
    } catch (err) {
      alert('重置密码失败');
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: currentStatus === 'active' ? 'inactive' : 'active' })
      });
      const result = await response.json();
      if (result.success) {
        fetchUsers();
      } else {
        alert(result.message || '更新状态失败');
      }
    } catch (err) {
      alert('更新状态失败');
    }
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-red-500',
    manager: 'bg-orange-500',
    member: 'bg-blue-500',
  };

  const roleLabels: Record<string, string> = {
    admin: '管理员',
    manager: '经理',
    member: '成员',
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
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">人员管理</h1>
      
      {/* 搜索框和添加按钮 */}
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="搜索姓名或用户名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 border rounded-md text-sm w-full bg-gray-50"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
        </div>
        
        {currentUser?.role === 'admin' && (
          <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}>添加用户</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditMode ? '编辑用户' : '添加用户'}</DialogTitle>
                <DialogDescription>{isEditMode ? '修改用户信息' : '填写用户信息'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名 *</Label>
                    <Input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      disabled={isEditMode}
                      placeholder={isEditMode ? '用户名不可修改' : ''}
                    />
                  </div>
                  {!isEditMode && (
                    <div className="space-y-2">
                      <Label htmlFor="password">密码 *</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  )}
                  {isEditMode && (
                    <div className="space-y-2">
                      <Label>密码</Label>
                      <Input
                        type="text"
                        value="••••••••"
                        disabled
                        className="text-muted-foreground"
                      />
                      <p className="text-xs text-muted-foreground">密码已加密，请使用"重置密码"功能修改</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="realName">真实姓名 *</Label>
                    <Input
                      id="realName"
                      name="realName"
                      value={formData.realName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">电话</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">部门 *</Label>
                    <Select
                      value={formData.departmentId}
                      onValueChange={(value) => handleSelectChange('departmentId', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择部门" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="officeId">科室</Label>
                    <Select
                      value={formData.officeId}
                      onValueChange={(value) => handleSelectChange('officeId', value)}
                      disabled={!formData.departmentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择科室（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office.id} value={office.id.toString()}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moduleId">模块</Label>
                    <Select
                      value={formData.moduleId}
                      onValueChange={(value) => handleSelectChange('moduleId', value)}
                      disabled={!formData.officeId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择模块（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map((mod) => (
                          <SelectItem key={mod.id} value={mod.id.toString()}>
                            {mod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">角色</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">成员</SelectItem>
                      <SelectItem value="manager">经理</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit">{isEditMode ? '保存修改' : '创建'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4">
        {(searchQuery ? filteredUsers : users).map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{user.real_name}</h3>
                  <p className="text-sm text-muted-foreground">{user.username}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status === 'active' ? '活跃' : '禁用'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">邮箱：</span>
                  <span className="font-medium">{user.email || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">电话：</span>
                  <span className="font-medium">{user.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">部门：</span>
                  <span className="font-medium">{user.department_name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">科室：</span>
                  <span className="font-medium">{user.office_name || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">模块：</span>
                  <span className="font-medium">{user.module_name || '-'}</span>
                </div>
              </div>

              {currentUser?.role === 'admin' && (
                <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleStatus(user.id, user.status)}
                  >
                    {user.status === 'active' ? '禁用用户' : '启用用户'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenPasswordDialog(user.id)}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    重置密码
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 删除确认对话框（移到外部，避免重复渲染） */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除该用户吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser}>删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置密码对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>为用户设置新密码</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码 *</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="请输入至少6位密码"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit">确认重置</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
