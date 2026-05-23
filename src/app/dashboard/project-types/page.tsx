'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface ProjectType {
  id: number;
  name: string;
  description: string | null;
  color: string;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export default function ProjectTypesPage() {
  const [types, setTypes] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProjectType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    sortOrder: 0
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/project-types', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        setTypes(result.data);
      } else {
        alert(result.message || '获取项目类型失败，请稍后重试');
      }
    } catch (err) {
      console.error('获取项目类型失败:', err);
      alert('获取项目类型失败，网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const url = editingType 
        ? `/api/project-types/${editingType.id}`
        : '/api/project-types';
      
      const response = await fetch(url, {
        method: editingType ? 'PUT' : 'POST',
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
        fetchTypes();
        alert(editingType ? '项目类型已更新' : '项目类型已创建');
      } else {
        alert((editingType ? '更新失败：' : '创建失败：') + (result.message || '请检查输入后重试'));
      }
    } catch (err) {
      console.error('操作失败:', err);
      alert('操作失败，网络错误，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/project-types/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        fetchTypes();
        alert(`项目类型"${name}"已删除`);
      } else {
        alert('删除失败：' + (result.message || '请稍后重试'));
      }
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败，网络错误，请稍后重试');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      sortOrder: 0
    });
    setEditingType(null);
  };

  const openEditDialog = (type: ProjectType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      color: type.color,
      sortOrder: type.sort_order
    });
    setDialogOpen(true);
  };

  const colorOptions = [
    { value: '#3b82f6', label: '蓝色', bg: 'bg-blue-500' },
    { value: '#22c55e', label: '绿色', bg: 'bg-green-500' },
    { value: '#f59e0b', label: '橙色', bg: 'bg-orange-500' },
    { value: '#ef4444', label: '红色', bg: 'bg-red-500' },
    { value: '#8b5cf6', label: '紫色', bg: 'bg-violet-500' },
    { value: '#ec4899', label: '粉色', bg: 'bg-pink-500' },
    { value: '#06b6d4', label: '青色', bg: 'bg-cyan-500' },
    { value: '#84cc16', label: '柠檬绿', bg: 'bg-lime-500' }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">项目类型管理</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              新建项目类型
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingType ? '编辑项目类型' : '新建项目类型'}</DialogTitle>
              <DialogDescription>
                {editingType ? '修改项目类型信息' : '填写项目类型信息'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">类型名称 *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="请输入类型名称，如：专项任务"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">类型描述</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="请输入类型描述，用于说明该类型的用途"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">显示颜色</Label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full ${color.bg} border-2 transition-all ${
                        formData.color === color.value ? 'border-foreground scale-110' : 'border-transparent hover:border-foreground'
                      }`}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sortOrder">排序顺序</Label>
                <Input
                  id="sortOrder"
                  name="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="数字越小越靠前"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '提交中...' : (editingType ? '更新' : '创建')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {types.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground mb-4">暂无项目类型</p>
              <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                创建第一个项目类型
              </Button>
            </CardContent>
          </Card>
        ) : (
          types.map((type) => (
            <Card key={type.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className="w-4 h-4 rounded-full mt-1.5 flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{type.name}</h3>
                        <span className="text-xs text-muted-foreground">排序：{type.sort_order}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{type.description || '暂无描述'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(type)}
                    >
                      编辑
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除项目类型</AlertDialogTitle>
                          <AlertDialogDescription>
                            您确定要删除项目类型"{type.name}"吗？如果有项目正在使用该类型，将无法删除。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(type.id, type.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
