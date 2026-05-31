
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SidebarProvider, Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import { API_BASE } from '@/lib/constants';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);

  const safePush = useCallback((path: string) => {
    if (isMountedRef.current && router) {
      router.push(path);
    }
  }, [router]);

  useEffect(() => {
    isMountedRef.current = true;
    
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token || !userData) {
      setTimeout(() => router.push('/'), 0);
      return;
    }
    try {
      setUser(JSON.parse(userData));
    } catch (e) {
      setTimeout(() => router.push('/'), 0);
    }
    
    return () => {
      isMountedRef.current = false;
    };
  }, [router]);

  // 获取未读消息数量
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/notifications?page_size=1`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.data.unreadCount || 0);
        }
      } catch (e) {
        console.error('获取未读消息失败:', e);
      }
    };
    
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // 打开通知面板
  const openNotificationPanel = async () => {
    setNotificationPanelOpen(true);
    setLoadingNotifications(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/notifications?page_size=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.list || []);
      }
    } catch (e) {
      console.error('获取通知列表失败:', e);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // 点击单条通知标记为已读
  const handleNotificationClick = async (notification: any) => {
    if (notification.is_read) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_BASE}/notifications`, {
        method: 'PATCH',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId: notification.id })
      });
      
      // 更新本地状态
      setNotifications(prev => prev.map(n => 
        n.id === notification.id ? { ...n, is_read: 1 } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error('标记已读失败:', e);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotificationPanelOpen(false);
      }
    };
    if (notificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationPanelOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    safePush('/');
  };

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 未读通知放在最前面
  const sortedNotifications = [...notifications].sort((a, b) => {
    // 未读的排在前面 (is_read=0 排在前面)
    if (a.is_read !== b.is_read) return (a.is_read || 0) - (b.is_read || 0);
    // 同等条件下按时间倒序
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const menuItems = [
    { icon: '📊', label: '任务大屏', path: '/dashboard' },
    { icon: '📋', label: '任务管理', path: '/dashboard/projects' },
    ...(user.role === 'admin' ? [
      { icon: '🤖', label: '模型配置', path: '/dashboard/model-config' },
      { icon: '👥', label: '人员管理', path: '/dashboard/users' },
      
    ] : []),
  ];

  return (
    <SidebarProvider>
      <style>{`
        [data-sidebar="trigger"] {
          display: none !important;
        }
      `}</style>
      <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900">
        {sidebarVisible && (
          <Sidebar side="left" className="flex-shrink-0">
            <SidebarHeader>
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-lg font-bold">任务管理系统</span>
                <button
                  onClick={() => setSidebarVisible(false)}
                  className="w-6 h-6 rounded hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
                  title="收起菜单"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
              </div>
            </SidebarHeader>

            <SidebarContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      onClick={() => safePush(item.path)}
                      isActive={pathname === item.path}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="hidden lg:block">
              <div className="px-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      {user.realName?.charAt(0) || user.username?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.realName || user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.role === 'admin' ? '管理员' : '普通用户'}</p>
                    </div>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={openNotificationPanel}
                      className="text-xs text-red-500 font-bold hover:bg-gray-100 p-1 rounded"
                    >
                      🔔 {unreadCount}
                    </button>
                  </div>
                </div>
                
                {notificationPanelOpen && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setNotificationPanelOpen(false)}>
                    <div 
                      ref={panelRef}
                      className="w-[280px] max-h-[400px] bg-white rounded-lg shadow-lg overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="p-3 border-b flex items-center justify-between">
                        <span className="font-medium">通知消息</span>
                        <button 
                          onClick={() => setNotificationPanelOpen(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {loadingNotifications ? (
                        <div className="p-4 text-center text-gray-500">加载中...</div>
                      ) : sortedNotifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">暂无通知</div>
                      ) : (
                        <div className="divide-y max-h-[340px] overflow-y-auto">
                          {sortedNotifications.map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-3 cursor-pointer hover:bg-gray-50 ${
                                !notification.is_read ? 'bg-yellow-50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!notification.is_read && (
                                  <span className="w-2 h-2 mt-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm ${!notification.is_read ? 'font-medium' : ''}`}>
                                    {notification.title}
                                  </p>
                                  {notification.content && (
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                      {notification.content}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatTime(notification.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleLogout}
                >
                  退出登录
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
        )}

        <button
          onClick={() => setSidebarVisible(true)}
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-white hover:bg-gray-50 text-gray-600 shadow-md rounded-r-lg px-1.2 py-5 flex flex-col items-center gap-1 border-l-0 ${sidebarVisible ? 'hidden' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span className="text-[9px] font-medium" style={{ writingMode: 'vertical-rl' }}>菜单</span>
        </button>

        <main className="flex-1 overflow-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}