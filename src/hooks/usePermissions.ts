'use client';

import { useState, useEffect, useCallback } from 'react';

interface UsePermissionsReturn {
  permissions: string[];
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  hasAllPermissions: (codes: string[]) => boolean;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

// 默认权限（管理员拥有所有权限）
const DEFAULT_ADMIN_PERMISSIONS = [
  'page_dashboard', 'page_projects', 'page_users', 'page_todos', 'page_settings', 'page_permissions',
  'project_create', 'project_edit', 'project_delete', 'project_manage_members',
  'user_create', 'user_edit', 'user_delete', 'role_manage'
];

export function usePermissions(): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPermissions([]);
        return;
      }

      const res = await fetch('/api/my-permissions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.data) {
        // 如果是 admin 角色，使用默认权限
        if (data.data.role === 'admin') {
          setPermissions(DEFAULT_ADMIN_PERMISSIONS);
        } else {
          setPermissions(data.data.permissions || []);
        }
      }
    } catch (error) {
      console.error('获取权限失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback((code: string) => {
    return permissions.includes(code);
  }, [permissions]);

  const hasAnyPermission = useCallback((codes: string[]) => {
    return codes.some(code => permissions.includes(code));
  }, [permissions]);

  const hasAllPermissions = useCallback((codes: string[]) => {
    return codes.every(code => permissions.includes(code));
  }, [permissions]);

  const isAdmin = useCallback(() => {
    return permissions.length >= DEFAULT_ADMIN_PERMISSIONS.length;
  }, [permissions]);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: isAdmin(),
    loading,
    refresh: fetchPermissions
  };
}

// 权限检查组件包装器
interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredAny?: string[];
  requiredAll?: string[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  requiredPermission, 
  requiredAny, 
  requiredAll,
  fallback = null 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return null;
  }

  let allowed = true;

  if (requiredPermission) {
    allowed = hasPermission(requiredPermission);
  }

  if (requiredAny && requiredAny.length > 0) {
    allowed = hasAnyPermission(requiredAny);
  }

  if (requiredAll && requiredAll.length > 0) {
    allowed = hasAllPermissions(requiredAll);
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// 条件渲染组件 - 有权限时显示 children，无权限时显示 fallback
export function ShowIfHasPermission({ 
  permission, 
  children, 
  fallback = null 
}: { 
  permission: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const { hasPermission, loading } = usePermissions();

  if (loading) return null;
  return hasPermission(permission) ? <>{children}</> : <>{fallback}</>;
}
