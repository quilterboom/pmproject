'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

// 服务商选项
const providerOptions = [
  { value: 'minimax-cn', label: 'MiniMax (中国)' },
  { value: 'minimax', label: 'MiniMax (国际)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'ollama', label: 'Ollama (本地)' },
  { value: 'custom', label: '自定义' },
];

export default function ModelConfigPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'minimax-cn',
    base_url: '',
    api_key: '',
    model: '',
    is_default: false,
  });
  const [saving, setSaving] = useState(false);
  
  // 测试模型连接状态
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

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
      const result = await res.json();

      if (result.success) {
        setUser(result.data);
        setIsAdmin(result.data.role === 'admin');
        fetchConfigs();
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('验证失败:', error);
      router.push('/');
    }
  };

  const fetchConfigs = async () => {
    try {
      const res = await fetch('/api/model-configs');
      const result = await res.json();
      if (result.success) {
        setConfigs(result.data);
      }
    } catch (error) {
      console.error('获取配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

const handleOpenDialog = (config?: any) => {
    if (config) {
      setEditingConfig(config);
      // 如果 api_key 是脱敏的，清空它让用户重新输入
      const safeApiKey = config.api_key && config.api_key.startsWith('***') ? '' : config.api_key;
      setFormData({
        name: config.name,
        provider: config.provider,
        base_url: config.base_url || '',
        api_key: safeApiKey,
        model: config.model,
        is_default: config.is_default === 1
      });
    } else {
      setEditingConfig(null);
      setFormData({
        name: '',
        provider: 'minimax-cn',
        base_url: '',
        api_key: '',
        model: '',
        is_default: false,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.provider || !formData.model) {
      alert('请填写完整信息');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // 构建请求数据
      const submitData: any = {
        id: editingConfig?.id,
        name: formData.name,
        provider: formData.provider,
        base_url: formData.base_url,
        model: formData.model,
        is_default: formData.is_default ? 1 : 0,
      };
      
      // 只有填写了新的 api_key 才传递，空字符串不传（保留原有值）
      if (formData.api_key && formData.api_key.trim()) {
        submitData.api_key = formData.api_key;
        console.log('提交 api_key:', formData.api_key.slice(0, 20) + '...');
      }
      
      const res = await fetch('/api/model-configs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(submitData)
      });

      const result = await res.json();
      if (result.success) {
        setDialogOpen(false);
        fetchConfigs();
      } else {
        alert(result.message || '保存失败');
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此配置吗？')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/model-configs?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await res.json();
      if (result.success) {
        fetchConfigs();
      } else {
        alert(result.message || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败');
    }
  };

  // 测试模型连接 - 使用 GET 请求
  const handleTest = async (config: any) => {
    setTestingId(config.id);
    setTestResult(null);
    
    try {
      // 使用 GET 请求，通过 URL 参数传递 config_id
      const res = await fetch(`/api/ai/test-model?config_id=${config.id}`, {
        method: 'GET',
      });
      const result = await res.json();
      setTestResult(result);
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || '测试失败' });
    } finally {
      setTestingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Button 
          variant="ghost" 
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          ← 返回主页
        </Button>

        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">模型配置</h1>
            <p className="text-muted-foreground">配置 AI 大模型供应商</p>
          </div>
          {isAdmin && (
            <Button onClick={() => handleOpenDialog()}>
              添加配置
            </Button>
          )}
        </div>

        {/* 配置列表 */}
        <div className="space-y-4">
          {configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold">{config.name}</h3>
                      {config.is_default === 1 && (
                        <Badge className="bg-blue-500">默认</Badge>
                      )}
                      {config.status === 'inactive' && (
                        <Badge variant="secondary">已禁用</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">供应商：</span>
                        {providerOptions.find(p => p.value === config.provider)?.label || config.provider}
                      </div>
                      <div>
                        <span className="font-medium">模型：</span>
                        {config.model}
                      </div>
                      {config.base_url && (
                        <div className="col-span-2">
                          <span className="font-medium">API地址：</span>
                          {config.base_url}
                        </div>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleTest(config)}
                        disabled={testingId === config.id}
                      >
                        {testingId === config.id ? '测试中...' : '测试'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenDialog(config)}
                      >
                        编辑
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDelete(config.id)}
                      >
                        删除
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {configs.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                暂无模型配置，请联系管理员添加
              </CardContent>
            </Card>
          )}

          {testResult && (
            <Card className={testResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <CardContent className="p-4">
                <div className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                  {testResult.success ? '✓ ' : '✗ '}{testResult.message}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 添加/编辑对话框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingConfig ? '编辑配置' : '添加配置'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>配置名称</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：MiniMax 默认"
                />
              </div>

              <div className="space-y-2">
                <Label>供应商</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                >
                  {providerOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>模型名称</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="如：MiniMax-M2.5"
                />
              </div>

              <div className="space-y-2">
                <Label>API 地址（可选）</Label>
                <Input
                  value={formData.base_url}
                  onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
                  placeholder="如：https://api.minimaxi.com/anthropic"
                />
              </div>

              <div className="space-y-2">
                <Label>API 密钥（可选）</Label>
                <Input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="留空保持不变"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label>设为默认模型</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}