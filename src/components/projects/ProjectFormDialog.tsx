'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores';

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProject: any;
  formData: any;
  setFormData: (data: any) => void;
  managerFilter: string;
  setManagerFilter: (filter: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  onAiParse: () => void;
  aiDescription: string;
  setAiDescription: (desc: string) => void;
  aiLoading: boolean;
  aiResult: any;
  onApplyAiResult: () => void;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  editingProject,
  formData,
  setFormData,
  managerFilter,
  setManagerFilter,
  onSubmit,
  submitting,
  onAiParse,
  aiDescription,
  setAiDescription,
  aiLoading,
  aiResult,
  onApplyAiResult,
}: ProjectFormDialogProps) {
  const { projectTypes, modules, users } = useProjectStore();

  const filteredUsers = managerFilter
    ? users.filter(u =>
        (u.real_name || u.username || '').toLowerCase().includes(managerFilter.toLowerCase())
      )
    : users;

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
    const currentManagers = formData.managerIds || [];
    if (currentManagers.includes(userId)) {
      setFormData({
        ...formData,
        managerIds: currentManagers.filter((id: string) => id !== userId)
      });
    } else {
      setFormData({
        ...formData,
        managerIds: [...currentManagers, userId]
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>新建任务</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProject ? '编辑任务' : '新建任务'}</DialogTitle>
          <DialogDescription>{editingProject ? '修改任务信息' : '填写任务信息'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
                    onAiParse();
                  }
                }}
              />
              <Button
                type="button"
                onClick={onAiParse}
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
                  <div>优先级：{aiResult.priority === 1 ? '高' : aiResult.priority === 2 ? '中' : '低'}</div>
                  {aiResult.endDate && <div>截止：{aiResult.endDate}</div>}
                  <div className="col-span-2">描述：{aiResult.description?.slice(0, 50)}...</div>
                </div>
                <Button
                  type="button"
                  onClick={onApplyAiResult}
                  className="mt-2"
                  size="sm"
                >
                  应用到表单
                </Button>
              </div>
            )}
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="projectType">任务类型</Label>
            <Select
              value={formData.projectTypeId}
              onValueChange={(value) => handleSelectChange('projectTypeId', value)}
            >
              <SelectTrigger id="projectType">
                <SelectValue placeholder="请选择任务类型（可选）" />
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

          <div className="space-y-2">
            <Label htmlFor="moduleId">所属模块</Label>
            <Select
              value={formData.moduleId}
              onValueChange={(value) => handleSelectChange('moduleId', value)}
            >
              <SelectTrigger id="moduleId">
                <SelectValue placeholder="请选择所属模块（可选）" />
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

          <div className="space-y-2">
            <Label>负责人 *</Label>
            <div className="border rounded-md p-4">
              <div className="mb-2">
                <Input
                  placeholder="搜索姓名..."
                  value={managerFilter}
                  onChange={(e) => setManagerFilter(e.target.value)}
                  className="h-8"
                />
              </div>
              <div className="overflow-x-auto pb-2" style={{ maxHeight: '200px' }}>
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

          <div className="space-y-2">
            <Label htmlFor="priority">任务优先级 *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="endDate">预期完成日期 *</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="currentProgress">任务进展详情</Label>
            <Textarea
              id="currentProgress"
              name="currentProgress"
              value={formData.currentProgress}
              onChange={handleInputChange}
              rows={3}
              placeholder="描述任务的当前进展情况..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
  );
}