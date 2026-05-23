'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [hoveredStatus, setHoveredStatus] = useState<number | null>(null);
  const [hoveredPriority, setHoveredPriority] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('zh-CN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit'
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStats(null);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('获取统计数据失败:', err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // 状态颜色映射
  const statusColors: Record<string, string> = {
    planning: 'bg-blue-500',
    in_progress: 'bg-yellow-500', 
    completed: 'bg-green-500',
    on_hold: 'bg-orange-500',
    cancelled: 'bg-red-500',
  };

  const statusLabels: Record<string, string> = {
    planning: '规划中',
    in_progress: '进行中',
    completed: '已完成',
    on_hold: '已暂停',
    cancelled: '已终止',
  };

  const statusOrder = ['in_progress', 'completed', 'planning', 'on_hold', 'cancelled'];

  // 计算状态百分比
  const getStatusPercent = (status: string) => {
    if (!stats?.byStatus) return 0;
    const item = stats.byStatus.find((s: any) => s.status === status);
    return stats.totalProjects > 0 ? Math.round((item?.count || 0) / stats.totalProjects * 100) : 0;
  };

  // 饼图颜色 - 状态: 规划中、进行中、已完成、已暂停、已终止
  const pieColors = ['#3b82f6', '#eab308', '#22c55e', '#f97316', '#ef4444'];
  const priorityColors = ['#ef4444', '#eab308', '#22c55e']; // 高(红)、中(黄)、低(绿)
  const priorityLabels = ['高', '中', '低'];
  const statusLabelsArr = ['规划中', '进行中', '已完成', '已暂停', '已终止'];
  const statusKeys = ['planning', 'in_progress', 'completed', 'on_hold', 'cancelled'];

  // 渲染交互式饼图（修复版）
  const renderPieChart = (
    data: { status?: string; priority?: number; count: number; percent: number }[],
    colors: string[],
    labelKey: 'status' | 'priority' = 'status',
    hoveredState: number | null,
    setHoveredState: (idx: number | null) => void
  ) => {
    // 过滤有效数据
    const validData = data.filter(d => d.count > 0);
    if (!validData || validData.length === 0) {
      return <div className="text-gray-400 text-sm text-center py-8">暂无数据</div>;
    }

    // 计算总数量
    const totalCount = validData.reduce((sum, d) => sum + d.count, 0);
    
    // 构建扇区，确保 100% 时也能正常显示
    let startAngle = -90;
    const slices = validData.map((item, idx) => {
      const percent = item.count / totalCount;
      const angle = percent * 360;
      const endAngle = startAngle + angle;
      
      // 计算扇形路径
      const r = 40;
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = 50 + r * Math.cos(startRad);
      const y1 = 50 + r * Math.sin(startRad);
      const x2 = 50 + r * Math.cos(endRad);
      const y2 = 50 + r * Math.sin(endRad);
      
      // 修复：当 angle >= 360 时（100%），直接画整圆
      let path: string;
      if (percent >= 1) {
        // 100% 时画整圆
        path = `M 50 10 A 40 40 0 1 1 50 90 A 40 40 0 1 1 50 10 Z`;
      } else if (angle > 180) {
        // 大于 180 度
        path = `M 50 50 L ${x1} ${y1} A 40 40 0 1 1 ${x2} ${y2} Z`;
      } else {
        // 小于等于 180 度
        path = `M 50 50 L ${x1} ${y1} A 40 40 0 0 1 ${x2} ${y2} Z`;
      }
      
      // 获取标签
      let labelText = '';
      let colorIndex = 0;
      if (labelKey === 'status') {
        const statusIdx = statusKeys.indexOf(item.status || '');
        labelText = statusIdx >= 0 ? statusLabelsArr[statusIdx] : item.status || '';
        colorIndex = statusIdx >= 0 ? statusIdx : idx;
      } else {
        const priorityIdx = (item.priority || 1) - 1;
        labelText = priorityIdx >= 0 && priorityIdx < 3 ? priorityLabels[priorityIdx] : `${item.priority}`;
        colorIndex = priorityIdx >= 0 && priorityIdx < 3 ? priorityIdx : idx;
      }
      
      startAngle = endAngle;
      
      return {
        path,
        color: colors[colorIndex % colors.length],
        label: labelText,
        count: item.count,
        percent: Math.round(percent * 100),
        index: idx
      };
    });

    return (
      <div className="relative">
        <svg viewBox="0 0 100 100" className="w-32 h-32">
          {slices.map((slice: any) => (
            <path
              key={slice.index}
              d={slice.path}
              fill={slice.color}
              className="transition-all duration-200 cursor-pointer"
              style={{
                transform: hoveredState === slice.index ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: '50px 50px',
                filter: hoveredState === slice.index ? 'brightness(1.1)' : 'none'
              }}
              onMouseEnter={() => setHoveredState(slice.index)}
              onMouseLeave={() => setHoveredState(null)}
            />
          ))}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
        {/* 悬停提示 */}
        {hoveredState !== null && slices[hoveredState] && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/95 px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-center">
              <div className="text-sm font-medium text-gray-800">
                {slices[hoveredState].label}: {slices[hoveredState].count}
              </div>
              <div className="text-xs text-gray-500">
                {slices[hoveredState].percent}%
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">请先登录系统</h2>
          <p className="text-gray-400 mb-4">登录后即可查看任务数据</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            前往登录
          </button>
        </div>
      </div>
    );
  }

  // 状态分布数据
  const statusData = statusOrder.map(status => ({
    status,
    count: stats?.byStatus?.find((s: any) => s.status === status)?.count || 0,
    percent: getStatusPercent(status)
  }));

  // 优先级分布数据
  const priorityData = [1, 2, 3].map(p => {
    const count = stats?.byPriority?.find((item: any) => parseInt(item.priority) === p)?.count || 0;
    return {
      priority: p,
      count,
      percent: stats.totalProjects > 0 ? Math.round(count / stats.totalProjects * 100) : 0
    };
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* 顶部标题区域 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">任务概览</h1>
            <p className="text-gray-400 mt-1">{currentTime}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-gray-900">{stats?.totalProjects || 0}</div>
            <div className="text-gray-400 text-sm">任务总数</div>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">总任务数</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.totalProjects || 0}</div>
            <div className="text-gray-400 text-xs mt-1">较上周 +{stats?.overview?.recentProjects || 0}</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">已完成</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.byStatus?.find((s: any) => s.status === 'completed')?.count || 0}
            </div>
            <div className="text-gray-400 text-xs mt-1">完成率 {getStatusPercent('completed')}%</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">进行中</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {stats?.byStatus?.find((s: any) => s.status === 'in_progress')?.count || 0}
            </div>
            <div className="text-gray-400 text-xs mt-1">占比 {getStatusPercent('in_progress')}%</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-gray-500 text-sm font-medium">平均进度</span>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats?.avgProgress || 0}%</div>
            <div className="text-gray-400 text-xs mt-1">整体进度</div>
          </div>
        </div>

        {/* 中间区域 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 左侧：时间相关统计 */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">最近7天新增</div>
                  <div className="text-2xl font-bold text-blue-600">{stats?.overview?.recentProjects || 0}</div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">即将到期（30天内）</div>
                  <div className="text-2xl font-bold text-orange-600">{stats?.overview?.upcomingProjects || 0}</div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-gray-500 text-sm">已超期</div>
                  <div className="text-2xl font-bold text-red-600">{stats?.overview?.overdueProjects || 0}</div>
                </div>
                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 中间：状态分布饼图 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-gray-700 font-medium mb-4 text-center">任务状态分布</h3>
            <div className="flex items-center justify-center gap-4">
              {renderPieChart(statusData, pieColors, 'status', hoveredStatus, setHoveredStatus)}
              <div className="space-y-2">
                {statusOrder.map((status, i) => {
                  const count = stats?.byStatus?.find((s: any) => s.status === status)?.count || 0;
                  return (
                    <div key={status} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${pieColors[i]}`} />
                      <span className="text-xs text-gray-600">{statusLabels[status]}</span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 右侧：优先级分布饼图 */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-gray-700 font-medium mb-4 text-center">优先级分布</h3>
            <div className="flex items-center justify-center gap-4">
              {renderPieChart(priorityData, priorityColors, 'priority', hoveredPriority, setHoveredPriority)}
              <div className="space-y-2">
                {[1, 2, 3].map((p, i) => {
                  const count = stats?.byPriority?.find((item: any) => parseInt(item.priority) === p)?.count || 0;
                  return (
                    <div key={p} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${priorityColors[i]}`} />
                      <span className="text-xs text-gray-600">优先级 {priorityLabels[i]}</span>
                      <span className="text-xs text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}