// 用户角色
export type UserRole = 'admin' | 'user';

// 用户状态
export type UserStatus = 'active' | 'inactive';

// 用户信息
export interface User {
  id: number;
  username: string;
  real_name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department_id?: number;
  created_at?: string;
  updated_at?: string;
}

// 用户列表响应
export interface UserListResponse {
  list: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// 登录请求
export interface LoginRequest {
  username: string;
  password: string;
}

// 登录响应
export interface LoginResponse {
  token: string;
  user: User;
}

// 注册请求
export interface RegisterRequest {
  username: string;
  password: string;
  real_name?: string;
  email?: string;
  phone?: string;
}

// 权限
export interface Permission {
  id: number;
  name: string;
  code: string;
  description?: string;
}

// 用户权限
export interface UserPermission {
  user_id: number;
  permission_id: number;
  permission: Permission;
}